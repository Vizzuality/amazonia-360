import json
from pathlib import Path
from typing import Any

import pytest
from mcp import Client
from mcp.types import TextContent

from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import TENA, FakeClient

pytestmark = pytest.mark.usefixtures("fixed_catalogue")


def server(tmp_path: Path) -> Any:
    return create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )


@pytest.mark.anyio
async def test_exposes_the_five_tools(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        names = {t.name for t in (await client.list_tools()).tools}
    assert names == {
        "list_indicators",
        "describe_indicator",
        "categories_in_area",
        "count_in_area",
        "area_by_category",
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

    [line] = (tmp_path / "calls.jsonl").read_text().splitlines()
    record = json.loads(line)
    assert record["tool"] == "area_by_category"
    assert record["indicator_id"] == 210
    assert record["ok"] is True
    assert record["timing"]["vertices_sent"] == 5


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
    async def boom(indicator_id: int, area: dict[str, Any]) -> Any:
        raise RuntimeError("boom")

    monkeypatch.setattr(AreaHandlers, "categories_in_area", staticmethod(boom))
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "categories_in_area", {"indicator_id": 210, "area": TENA}
        )
    assert result.is_error
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
    [issue] = result.structured_content["known_issues"]
    assert "7 records" in issue
