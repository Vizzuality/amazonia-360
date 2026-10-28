import base64
import math
from pathlib import Path
from typing import Any

import pytest
from mcp import Client
from mcp.types import TextResourceContents
from shapely.geometry import Polygon

from mcp_server.handlers.area import AreaHandlers
from mcp_server.maps import CATEGORIES_URI, COMPARE_URI, RASTER_URI
from mcp_server.measurement.call_log import CallLog
from mcp_server.places import Places
from mcp_server.server import create_mcp_server
from tests.test_handlers import TENA, FakeClient
from tests.test_places import SNAPSHOT

pytestmark = pytest.mark.usefixtures("fixed_catalogue")

VIEWS = {
    "map_area_by_category": CATEGORIES_URI,
    "map_class_shares_in_area": RASTER_URI,
}


class DetailedClient(FakeClient):
    """One forest patch with many vertices, which simplifying can shrink."""

    async def features(self, layer: Any, aoi: Any, max_allowable_offset: float) -> Any:
        self.calls.append("features")
        turn = 2 * math.pi / 4000
        ring = [
            (
                -77.85 + 0.04 * (1 + 0.002 * (i % 7)) * math.cos(turn * i),
                -1.05 + 0.04 * (1 + 0.002 * (i % 5)) * math.sin(turn * i),
            )
            for i in range(4000)
        ]
        return [("Bosque", Polygon(ring))]


def server(tmp_path: Path, client: FakeClient | None = None) -> Any:
    places = Places(SNAPSHOT)
    return create_mcp_server(
        handlers=AreaHandlers(client or FakeClient(), places=places),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
        places=places,
    )


@pytest.mark.anyio
async def test_each_map_tool_points_at_its_view(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        tools = {t.name: t for t in (await client.list_tools()).tools}
    for name, uri in VIEWS.items():
        assert tools[name].meta == {"ui": {"resourceUri": uri}}
    assert (
        tools["map_area_by_category"].output_schema
        == tools["area_by_category"].output_schema
    )


@pytest.mark.anyio
async def test_each_view_is_a_complete_page_with_its_csp(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        for uri in VIEWS.values():
            content = (await client.read_resource(uri)).contents[0]
            assert isinstance(content, TextResourceContents)
            assert content.mime_type == "text/html;profile=mcp-app"
            assert content.meta is not None
            domains = content.meta["ui"]["csp"]["resourceDomains"]
            assert "https://tiles.openfreemap.org" in domains
            for marker in (
                "/*THEME*/",
                "/*LEGEND*/",
                "/*COMMON*/",
                "/*BRIDGE*/",
                "/*FONTS*/",
            ):
                assert marker not in content.text


@pytest.mark.anyio
async def test_the_map_tool_answers_what_area_by_category_answers(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        args = {"indicator_id": 210, "area": TENA}
        plain = await client.call_tool("area_by_category", args)
        mapped = await client.call_tool("map_area_by_category", args)
    assert plain.structured_content is not None
    assert mapped.structured_content is not None
    for key in ("value", "aoi_ha", "coverage", "caveats", "provenance"):
        assert mapped.structured_content[key] == plain.structured_content[key]
    # The shapes are for the page, not for the model.
    assert "shapes" not in mapped.content[0].text  # type: ignore[union-attr]
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert [item["c"] for item in drawn["shapes"]] == ["Bosque"]
    assert set(drawn["styles"]) == {"Bosque"}
    logged = (tmp_path / "calls.jsonl").read_text()
    assert '"tool": "map_area_by_category"' in logged


@pytest.mark.anyio
async def test_the_raster_map_answers_what_class_shares_in_area_answers(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        args = {"indicator_id": 129, "area": TENA}
        plain = await client.call_tool("class_shares_in_area", args)
        mapped = await client.call_tool("map_class_shares_in_area", args)
    assert plain.structured_content is not None
    assert mapped.structured_content is not None
    assert mapped.structured_content["value"] == plain.structured_content["value"]
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert base64.b64decode(drawn["image"].split(",", 1)[1]) == b"\x89PNG"
    assert drawn["name"] == "Canopy height"
    assert "image" not in mapped.content[0].text  # type: ignore[union-attr]


@pytest.mark.anyio
async def test_the_map_gets_the_area_of_a_place(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        for tool in VIEWS:
            indicator = 210 if tool == "map_area_by_category" else 129
            result = await client.call_tool(
                tool, {"indicator_id": indicator, "place_id": "canton:Napo/Tena"}
            )
            assert result.meta is not None
            assert result.meta["map"]["area"]["type"] == "Polygon"


@pytest.mark.anyio
async def test_shapes_are_left_out_when_they_cannot_fit_the_budget(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from mcp_server import maps

    args = {"indicator_id": 210, "area": TENA}
    monkeypatch.setattr(maps, "BUDGET_BYTES", 100)
    async with Client(server(tmp_path)) as client:
        mapped = await client.call_tool("map_area_by_category", args)
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert "shapes" not in drawn
    assert drawn["shapes_omitted_bytes"] > 0
    # The legend still has its colours.
    assert set(drawn["styles"]) == {"Bosque"}


@pytest.mark.anyio
async def test_the_map_sends_encoded_shapes_and_their_grid(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        mapped = await client.call_tool(
            "map_area_by_category", {"indicator_id": 210, "area": TENA}
        )
    assert mapped.meta is not None
    drawn = mapped.meta["map"]
    assert set(drawn["grid"]) == {"x0", "y0", "step"}
    assert set(drawn["shapes"][0]) == {"c", "p"}
    assert drawn["simplified"] is False


@pytest.mark.anyio
async def test_the_map_result_stays_under_the_budget(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from mcp_server import maps

    args = {"indicator_id": 210, "area": TENA}
    async with Client(server(tmp_path, DetailedClient())) as client:
        full = await client.call_tool("map_area_by_category", args)
        whole = len(full.model_dump_json(by_alias=True))
        # Short of what the first tolerance needs, by more than the few bytes the
        # client's copy of a result adds to the server's.
        monkeypatch.setattr(maps, "BUDGET_BYTES", whole - 2000)
        mapped = await client.call_tool("map_area_by_category", args)
    assert mapped.meta is not None
    assert mapped.meta["map"]["simplified"] is True
    assert "shapes" in mapped.meta["map"]
    assert len(mapped.model_dump_json(by_alias=True)) <= whole - 2000


class ReliefMissingClient(FakeClient):
    """The relief layer has no shapes in the area; the others do."""

    async def features(self, layer: Any, aoi: Any, max_allowable_offset: float) -> Any:
        if layer.category_field == "Relieve":
            self.calls.append("features")
            return []
        return await super().features(layer, aoi, max_allowable_offset)


COMPARE = {"left_indicator_id": 210, "right_indicator_id": 211, "area": TENA}


@pytest.mark.anyio
async def test_the_compare_tool_points_at_its_view(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        tools = {t.name: t for t in (await client.list_tools()).tools}
        resource = await client.read_resource(COMPARE_URI)
    assert tools["compare_on_map"].meta == {"ui": {"resourceUri": COMPARE_URI}}
    [content] = resource.contents
    assert isinstance(content, TextResourceContents)
    assert "/*COMMON*/" not in content.text


@pytest.mark.anyio
async def test_compare_answers_what_two_area_by_category_calls_answer(
    tmp_path: Path,
) -> None:
    async with Client(server(tmp_path)) as client:
        left = await client.call_tool(
            "area_by_category", {"indicator_id": 210, "area": TENA}
        )
        right = await client.call_tool(
            "area_by_category", {"indicator_id": 211, "area": TENA}
        )
        compared = await client.call_tool("compare_on_map", COMPARE)
    assert compared.structured_content is not None
    for side, plain in (("left", left), ("right", right)):
        assert plain.structured_content is not None
        compared_side = compared.structured_content[side]
        for key in ("indicator_id", "value", "aoi_ha", "coverage"):
            assert compared_side[key] == plain.structured_content[key]
    assert "shapes" not in compared.content[0].text  # type: ignore[union-attr]


@pytest.mark.anyio
async def test_compare_sends_both_layers_with_one_area_and_grid(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        compared = await client.call_tool("compare_on_map", COMPARE)
    assert compared.meta is not None
    drawn = compared.meta["map"]
    assert set(drawn) == {"area", "grid", "left", "right"}
    for side in ("left", "right"):
        assert {"name", "styles", "simplified"} <= set(drawn[side])
        assert "shapes" in drawn[side] or "shapes_omitted_bytes" in drawn[side]
    assert all(drawn[side]["name"] for side in ("left", "right"))


@pytest.mark.anyio
async def test_compare_stays_under_the_budget(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from mcp_server import maps

    async with Client(server(tmp_path, DetailedClient())) as client:
        full = await client.call_tool("compare_on_map", COMPARE)
        whole = len(full.model_dump_json(by_alias=True))
        monkeypatch.setattr(maps, "BUDGET_BYTES", whole - 2000)
        compared = await client.call_tool("compare_on_map", COMPARE)
    assert compared.meta is not None
    drawn = compared.meta["map"]
    assert drawn["left"]["simplified"] or drawn["right"]["simplified"]
    assert len(compared.model_dump_json(by_alias=True)) <= whole - 2000


@pytest.mark.anyio
async def test_the_same_indicator_twice_is_refused(tmp_path: Path) -> None:
    client = FakeClient()
    async with Client(server(tmp_path, client)) as mcp:
        result = await mcp.call_tool(
            "compare_on_map",
            {"left_indicator_id": 210, "right_indicator_id": 210, "area": TENA},
        )
    assert result.is_error
    assert "two different indicators" in result.content[0].text  # type: ignore[union-attr]
    assert client.calls == []


@pytest.mark.anyio
async def test_an_indicator_without_area_by_category_is_refused(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "compare_on_map",
            {"left_indicator_id": 210, "right_indicator_id": 129, "area": TENA},
        )
    assert result.is_error


@pytest.mark.anyio
async def test_a_side_without_shapes_is_drawn_empty(tmp_path: Path) -> None:
    async with Client(server(tmp_path, ReliefMissingClient())) as client:
        compared = await client.call_tool("compare_on_map", COMPARE)
    assert not compared.is_error
    assert compared.meta is not None
    assert compared.meta["map"]["right"]["shapes"] == []
    assert compared.meta["map"]["left"]["shapes"]
