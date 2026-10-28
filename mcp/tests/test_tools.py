import json
from pathlib import Path
from typing import Any

import pytest
from mcp import Client
from mcp.types import TextContent

from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.places import Places
from mcp_server.server import create_mcp_server
from tests.test_handlers import TENA, FakeClient
from tests.test_places import SNAPSHOT

pytestmark = pytest.mark.usefixtures("fixed_catalogue")


def server(tmp_path: Path) -> Any:
    places = Places(SNAPSHOT)
    return create_mcp_server(
        handlers=AreaHandlers(FakeClient(), places=places),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
        places=places,
    )


@pytest.mark.anyio
async def test_exposes_the_tools(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        names = {t.name for t in (await client.list_tools()).tools}
    assert names == {
        "list_indicators",
        "describe_indicator",
        "find_places",
        "list_places",
        "categories_in_area",
        "count_in_area",
        "area_by_category",
        "class_shares_in_area",
        "map_area_by_category",
        "map_class_shares_in_area",
        "compare_on_map",
    }


@pytest.mark.anyio
async def test_list_indicators_by_subtopic(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("list_indicators", {"subtopic_id": 1})
    assert result.structured_content is not None
    ids = {i["id"] for i in result.structured_content["indicators"]}
    assert ids == {211}


@pytest.mark.anyio
async def test_list_indicators_names_the_tools_each_one_takes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from mcp_server import catalogue
    from tests.test_models import indicator

    listed = {
        210: indicator(description_short="Ecosystem classes."),
        202: indicator(
            id=202,
            value_type="count",
            aggregation="sum",
            category_field="Practica",
            sync={"sync_status": "ok", "queryable_fields": ["Practica"]},
        ),
        211: indicator(id=211, ai_answerable=False),
        218: indicator(id=218, resource=None),
    }
    monkeypatch.setattr(catalogue, "_catalogue", lambda: listed)
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("list_indicators", {})
    assert result.structured_content is not None
    by_id = {i["id"]: i for i in result.structured_content["indicators"]}
    assert by_id[210]["tools"] == ["categories_in_area", "area_by_category"]
    assert by_id[210]["description_short"] == "Ecosystem classes."
    assert by_id[202]["tools"] == ["count_in_area"]
    # Listed but refused: the model can say the data exists and is not cleared.
    assert by_id[211]["tools"] == []
    assert by_id[211]["ai_answerable"] is False
    assert by_id[218]["tools"] == []


@pytest.mark.anyio
async def test_area_tools_publish_an_output_schema_with_field_meanings(
    tmp_path: Path,
) -> None:
    # Field descriptions are how the model learns what a number means, since caveats
    # are reserved for what a person wrote.
    async with Client(server(tmp_path)) as client:
        tools = {t.name: t for t in (await client.list_tools()).tools}
    schema = tools["area_by_category"].output_schema
    assert schema is not None
    text = json.dumps(schema)
    assert "not a class" in text
    assert "written by a person" in text
    assert "module boundary, not the layer" in text
    assert "has not been curated yet" in text


@pytest.mark.anyio
async def test_describe_unknown_indicator_is_a_tool_error(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("describe_indicator", {"indicator_id": 999})
    assert result.is_error
    content = result.content[0]
    assert isinstance(content, TextContent)
    assert "Unknown indicator 999" in content.text


@pytest.mark.anyio
async def test_area_tool_returns_the_envelope_and_logs_the_call(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "area_by_category", {"indicator_id": 210, "area": TENA}
        )
    assert not result.is_error
    assert result.structured_content is not None
    body = result.structured_content
    assert body["computed_over"]["type"] == "clipped_polygons"
    assert "total_ms" in body["timing"]
    # FakeClient's one feature covers the whole box, so nothing is left unclassified.
    assert body["unclassified_ha"] == 0
    assert body["classified_ha"] == body["aoi_ha"]

    [line] = (tmp_path / "calls.jsonl").read_text().splitlines()
    record = json.loads(line)
    assert record["tool"] == "area_by_category"
    assert record["indicator_id"] == 210
    assert record["ok"] is True
    assert record["user"] is None  # stdio has no caller
    assert record["timing"]["vertices_sent"] == 5
    assert record["source"] == "arcgis"
    assert record["layer_version"] is None


@pytest.mark.anyio
async def test_refusals_reach_the_client_with_their_reason_and_are_logged(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "count_in_area", {"indicator_id": 210, "area": TENA}
        )
    assert result.is_error
    content = result.content[0]
    assert isinstance(content, TextContent)
    assert "does not support count" in content.text
    record = json.loads((tmp_path / "calls.jsonl").read_text())
    assert record["ok"] is False
    assert "does not support count" in record["error"]
    assert isinstance(record["elapsed_ms"], int)


@pytest.mark.anyio
async def test_pathological_failures_are_logged_too(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def boom(
        indicator_id: int, area: dict[str, Any], *, place_id: str | None = None
    ) -> Any:
        raise RuntimeError("boom")

    monkeypatch.setattr(AreaHandlers, "categories_in_area", staticmethod(boom))
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "categories_in_area", {"indicator_id": 210, "area": TENA}
        )
    assert result.is_error
    content = result.content[0]
    assert isinstance(content, TextContent)
    # The model gets the cause, not a bare "Error executing tool".
    assert "RuntimeError: boom" in content.text
    [line] = (tmp_path / "calls.jsonl").read_text().splitlines()
    record = json.loads(line)
    assert record["ok"] is False
    assert record["error"] == "RuntimeError: boom"
    assert isinstance(record["elapsed_ms"], int)


@pytest.mark.anyio
async def test_describe_indicator_shows_the_count_mismatch(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from mcp_server import catalogue
    from tests.test_models import indicator

    mismatched = indicator(
        documented_count=7,
        sync={
            "sync_status": "ok",
            "queryable_fields": ["Ecosistema"],
            "published_count": 3,
        },
    )
    monkeypatch.setattr(catalogue, "_catalogue", lambda: {210: mismatched})
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("describe_indicator", {"indicator_id": 210})
    assert result.structured_content is not None
    assert result.structured_content["record_counts"] == {
        "documented": 7,
        "published": 3,
    }


@pytest.mark.anyio
async def test_find_places(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("find_places", {"query": "Pastaza"})
    assert result.structured_content is not None
    found = result.structured_content["places"]
    assert [p["id"] for p in found] == ["province:Pastaza", "canton:Pastaza/Pastaza"]
    assert "ask the user" in result.structured_content["note"]


@pytest.mark.anyio
async def test_list_places(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "list_places", {"kind": "canton", "province": "Pastaza"}
        )
    assert result.structured_content is not None
    found = result.structured_content["places"]
    assert found and all(p["province"] == "Pastaza" for p in found)
    assert result.structured_content["count"] == len(found)


@pytest.mark.anyio
async def test_an_over_long_query_or_place_id_is_refused(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        query = await client.call_tool("find_places", {"query": "x" * 201})
        place = await client.call_tool(
            "count_in_area", {"indicator_id": 202, "place_id": "x" * 201}
        )
    for result in (query, place):
        assert result.is_error
        text = result.content[0]
        assert isinstance(text, TextContent) and "200" in text.text


@pytest.mark.anyio
async def test_an_area_tool_takes_a_place_and_logs_it(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "area_by_category",
            {"indicator_id": 210, "place_id": "canton:Napo/Tena"},
        )
    assert result.structured_content is not None
    assert result.structured_content["place"]["id"] == "canton:Napo/Tena"
    record = json.loads((tmp_path / "calls.jsonl").read_text().splitlines()[-1])
    assert record["place_id"] == "canton:Napo/Tena"


@pytest.mark.anyio
async def test_an_area_tool_without_area_or_place_says_what_to_send(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("count_in_area", {"indicator_id": 202})
    assert result.is_error
    text = result.content[0]
    assert isinstance(text, TextContent) and "find_places" in text.text


def logged(tmp_path: Path) -> list[dict[str, Any]]:
    path = tmp_path / "calls.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines()]


@pytest.mark.anyio
async def test_the_place_and_catalogue_tools_are_logged(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        await client.call_tool("find_places", {"query": "Tena", "kind": "canton"})
        await client.call_tool("list_places", {"kind": "canton", "province": "Napo"})
        await client.call_tool("list_indicators", {"subtopic_id": 1})
        await client.call_tool("describe_indicator", {"indicator_id": 210})
    lines = logged(tmp_path)
    assert [line["tool"] for line in lines] == [
        "find_places",
        "list_places",
        "list_indicators",
        "describe_indicator",
    ]
    assert all(line["ok"] is True and line["session"] is None for line in lines)
    assert all(line["user"] is None and line["elapsed_ms"] >= 0 for line in lines)
    assert lines[0]["query"] == "Tena" and lines[0]["kind"] == "canton"
    assert lines[1]["kind"] == "canton" and lines[1]["province"] == "Napo"
    assert lines[2]["subtopic_id"] == 1
    assert lines[3]["indicator_id"] == 210


@pytest.mark.anyio
async def test_a_refused_describe_is_logged_with_its_error(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("describe_indicator", {"indicator_id": 999})
    assert result.is_error
    [line] = logged(tmp_path)
    assert line["tool"] == "describe_indicator" and line["ok"] is False
    assert "Unknown indicator 999" in line["error"]
