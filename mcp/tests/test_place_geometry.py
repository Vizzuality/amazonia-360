from typing import Any

import pytest
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError
from mcp_server.places.geometry import PlaceGeometries
from mcp_server.places.models import Place

TENA = Place.model_validate(
    {
        "id": "canton:Napo/Tena",
        "name": "Tena",
        "kind": "canton",
        "province": "Napo",
        "category": None,
        "area_ha": 1000.0,
        "bbox": [-77.9, -1.1, -77.8, -1.0],
        "source": {"url": "https://example.test/a2", "layer_id": 6, "where": "x"},
    }
)


class Boundaries:
    def __init__(self, shapes: list[BaseGeometry]) -> None:
        self.shapes = shapes
        self.calls: list[tuple[str, int, str]] = []

    async def boundary(self, url: str, layer_id: int, where: str) -> list[Any]:
        self.calls.append((url, layer_id, where))
        return self.shapes


class Clock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


@pytest.mark.anyio
async def test_reads_the_source_and_joins_the_pieces() -> None:
    client = Boundaries([box(0, 0, 1, 1), box(2, 0, 3, 1)])
    geom = await PlaceGeometries(client).geometry(TENA)  # type: ignore[arg-type]
    assert isinstance(geom, MultiPolygon)
    assert client.calls == [("https://example.test/a2", 6, "x")]


@pytest.mark.anyio
async def test_second_use_comes_from_the_cache() -> None:
    client = Boundaries([box(0, 0, 1, 1)])
    geometries = PlaceGeometries(client)  # type: ignore[arg-type]
    await geometries.geometry(TENA)
    await geometries.geometry(TENA)
    assert len(client.calls) == 1


@pytest.mark.anyio
async def test_cache_expires_after_a_day() -> None:
    client = Boundaries([box(0, 0, 1, 1)])
    clock = Clock()
    geometries = PlaceGeometries(client, clock=clock)  # type: ignore[arg-type]
    await geometries.geometry(TENA)
    clock.now = 86_401
    await geometries.geometry(TENA)
    assert len(client.calls) == 2


@pytest.mark.anyio
async def test_invalid_boundary_is_repaired() -> None:
    bowtie = Polygon([(0, 0), (1, 1), (1, 0), (0, 1), (0, 0)])
    assert not bowtie.is_valid
    geom = await PlaceGeometries(Boundaries([bowtie])).geometry(TENA)  # type: ignore[arg-type]
    assert geom.is_valid and isinstance(geom, Polygon | MultiPolygon)


@pytest.mark.anyio
async def test_place_with_no_features_says_to_search_again() -> None:
    geometries = PlaceGeometries(Boundaries([]))  # type: ignore[arg-type]
    with pytest.raises(ArcGISError, match="find_places"):
        await geometries.geometry(TENA)
