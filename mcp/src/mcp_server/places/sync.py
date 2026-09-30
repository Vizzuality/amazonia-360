"""Reads the place names and their areas from the boundary layers, for find_places.

Run by ``amazonia360-mcp-catalogue sync``. Unlike the catalogue sync, one source that
cannot be read fails the whole run, and the previous snapshot stays.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx
import shapely
from shapely.errors import ShapelyError

from mcp_server.arcgis.esri_json import exceeded_transfer_limit, polygon_from_rings
from mcp_server.catalogue.sync import utc_timestamp
from mcp_server.geometry.area import geodesic_area_ha
from mcp_server.places.models import PlaceKind

_SERVICES = "https://services6.arcgis.com/sROlVM0rATIYgC6a"


class PlacesSyncError(Exception):
    pass


@dataclass(frozen=True)
class BoundarySource:
    kind: PlaceKind
    url: str
    layer_id: int
    name_field: str
    parent_field: str | None
    category_field: str | None
    base_where: str


# The administrative layers are the ones the front end draws
# (client/src/constants/datasets.ts); they hold whole units that touch the region.
SOURCES: tuple[BoundarySource, ...] = (
    BoundarySource(
        kind="province",
        url=f"{_SERVICES}/ArcGIS/rest/services/Political_administrative_division_of_order_1/FeatureServer",
        layer_id=4,
        name_field="NAME_1",
        parent_field=None,
        category_field=None,
        base_where="GID_0 = 'ECU'",
    ),
    BoundarySource(
        kind="canton",
        url=f"{_SERVICES}/ArcGIS/rest/services/Political_administrative_division_of_order_2/FeatureServer",
        layer_id=6,
        name_field="NAME_2",
        parent_field="NAME_1",
        category_field=None,
        base_where="GID_0 = 'ECU'",
    ),
    BoundarySource(
        kind="protected_area",
        url=f"{_SERVICES}/arcgis/rest/services/l_17_sistema_nacional_de_areas_protegidas_del_modulo_ecuatoriano/FeatureServer",
        layer_id=0,
        name_field="Nombre",
        parent_field=None,
        category_field="Categoria",
        base_where="1=1",
    ),
)


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _where(source: BoundarySource, name: str, parent: str | None) -> str:
    parts = [] if source.base_where == "1=1" else [source.base_where]
    if source.parent_field is not None and parent is not None:
        parts.append(f"{source.parent_field} = {quote(parent)}")
    parts.append(f"{source.name_field} = {quote(name)}")
    return " AND ".join(parts)


def _id(source: BoundarySource, name: str, parent: str | None) -> str:
    return f"{source.kind}:{parent}/{name}" if parent else f"{source.kind}:{name}"


async def _features(
    http: httpx.AsyncClient, source: BoundarySource
) -> list[dict[str, Any]]:
    fields = [source.name_field, source.parent_field, source.category_field]
    response = await http.post(
        f"{source.url}/{source.layer_id}/query",
        data={
            "where": source.base_where,
            "outFields": ",".join(f for f in fields if f),
            "returnGeometry": "true",
            "outSR": "4326",
            # Not geojson: ArcGIS Online's GeoJSON turns enclaves into shells.
            "f": "json",
        },
    )
    response.raise_for_status()
    body = response.json()
    if "error" in body or "features" not in body:
        raise PlacesSyncError(f"{source.url}/{source.layer_id}: {body}")
    if exceeded_transfer_limit(body):
        raise PlacesSyncError(f"{source.url}/{source.layer_id}: truncated")
    return body["features"]


async def _places(
    http: httpx.AsyncClient, source: BoundarySource
) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for feature in await _features(http, source):
        props = feature.get("attributes") or {}
        name = props.get(source.name_field)
        if not name or feature.get("geometry") is None:
            continue
        parent = props.get(source.parent_field) if source.parent_field else None
        place_id = _id(source, name, parent)
        entry = grouped.setdefault(
            place_id,
            {
                "id": place_id,
                "name": name,
                "kind": source.kind,
                "province": parent,
                "category": props.get(source.category_field)
                if source.category_field
                else None,
                "shapes": [],
                "source": {
                    "url": source.url,
                    "layer_id": source.layer_id,
                    "where": _where(source, name, parent),
                },
            },
        )
        geom = polygon_from_rings(feature["geometry"]["rings"])
        if geom.is_empty:
            raise PlacesSyncError(f"{place_id}: a feature with no area")
        entry["shapes"].append(geom)
    places = []
    for entry in grouped.values():
        geom = shapely.make_valid(shapely.union_all(entry.pop("shapes")))
        entry["area_ha"] = round(geodesic_area_ha(geom), 1)
        entry["bbox"] = [round(v, 4) for v in geom.bounds]
        places.append(entry)
    places.sort(key=lambda p: (p["province"] or "", p["name"]))
    return places


async def sync_places(http: httpx.AsyncClient, now: datetime) -> dict[str, Any]:
    try:
        places = [p for s in SOURCES for p in await _places(http, s)]
    except (
        httpx.HTTPError,
        AttributeError,
        KeyError,
        ShapelyError,
        TypeError,
        ValueError,
    ) as exc:
        raise PlacesSyncError(str(exc)) from exc
    return {"generated_at": utc_timestamp(now), "places": places}
