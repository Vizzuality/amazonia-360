# MCP places by name and methodology skill: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user name a province, canton or protected area instead of pasting GeoJSON, and ship the method as a skill.

**Architecture:** A new `mcp_server/places/` package holds a snapshot of place names written by the catalogue sync, and does the matching. The handlers resolve a `place_id` to a boundary fetched from ArcGIS and cached for 24 hours. Every area tool, map tools included, takes `area` or `place_id`. The skill is a Markdown file under `mcp/skills/`, installed by hand.

**Tech Stack:** Python 3.12, `mcp` 2.2 (`MCPServer`), shapely 2, httpx, pydantic 2, pytest with anyio, uv.

**Spec:** `docs/superpowers/specs/2026-09-30-mcp-places-and-methodology-design.md`

## Global Constraints

- Branch `feat/mcp-module`. Push only to `origin/feat/mcp-module`; no merge, no PR.
- Every commit message ends with `Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF`.
- No new dependencies. No Docker.
- Code, comments and docs in English. Ruff (line length 88) and Pyright (standard) clean.
- Commands run from `mcp/`: `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .`, `uv run pyright`.
- Place ids: `province:<NAME_1>`, `canton:<NAME_1>/<NAME_2>`, `protected_area:<Nombre>`.
- The server never picks one place among several matches.
- The client's 5,000-vertex limit (`MAX_VERTICES`) applies to `area`, not to a place.
- Place geometries are cached in process for 24 hours.
- Boundary sources (checked live on 30 September 2026):
  - provinces: `https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_1/FeatureServer`, layer 4, `NAME_1`, where `GID_0 = 'ECU'`;
  - cantons: `https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_2/FeatureServer`, layer 6, `NAME_2` with `NAME_1`, where `GID_0 = 'ECU'`;
  - protected areas: `https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/l_17_sistema_nacional_de_areas_protegidas_del_modulo_ecuatoriano/FeatureServer`, layer 0, `Nombre` with `Categoria`, where `1=1`.

## Review Focus

1. **A name with an apostrophe or an accent** ("Vírgen del Rosario", a name with `'`) must produce a where clause that ArcGIS accepts. Pinned in Task 2 (`test_where_doubles_quotes`).
2. **A place whose where clause now returns no features** (the layer was republished or renamed) must fail with a message that sends the model back to `find_places`, not crash on an empty union. Pinned in Task 3 (`test_place_with_no_features_says_to_search_again`).
3. **An invalid boundary from ArcGIS** (a self-intersecting ring) must be repaired, not refused as "not a valid polygon". Pinned in Task 3 (`test_invalid_boundary_is_repaired`).
4. **A query with spaces, capitals or no accents** ("  TENA ", "yasuni") must match. Pinned in Task 1 (`test_match_ignores_case_accents_and_spaces`).
5. **A cached boundary older than 24 hours** must be fetched again. Pinned in Task 3 (`test_cache_expires_after_a_day`).

---

### Task 1: Place models, snapshot loader and matching

**Files:**
- Create: `mcp/src/mcp_server/places/__init__.py`
- Create: `mcp/src/mcp_server/places/models.py`
- Test: `mcp/tests/test_places.py`

**Interfaces:**
- Produces:
  - `PlaceKind = Literal["province", "canton", "protected_area"]`
  - `PlaceSource(url: str, layer_id: int, where: str)`
  - `Place(id, name, kind, province: str | None, category: str | None, area_ha: float, bbox: list[float], source: PlaceSource)`
  - `PlaceSummary`: `Place` without `source`; `Place.summary() -> PlaceSummary`
  - `PlaceMatches(places: list[PlaceSummary], note: str | None)`
  - `PlacesSnapshot(generated_at: str, places: list[Place])`
  - `normalise(text: str) -> str`
  - `class Places`: `Places(snapshot: PlacesSnapshot)`, `.get(place_id) -> Place | None`, `.find(query, kind=None) -> PlaceMatches`
  - `load_places() -> Places` (cached; reads `places/places.snapshot.json`)
  - `SNAPSHOT_FILE = "places.snapshot.json"`

- [ ] **Step 1: Write the failing tests**

`mcp/tests/test_places.py`:

```python
from typing import Any

import pytest

from mcp_server.places import Places, normalise
from mcp_server.places.models import Place, PlacesSnapshot

ADMIN1 = "https://example.test/admin1/FeatureServer"
ADMIN2 = "https://example.test/admin2/FeatureServer"
SNAP = "https://example.test/snap/FeatureServer"


def place(
    id: str, name: str, kind: str, province: str | None = None, **extra: Any
) -> dict[str, Any]:
    url = {"province": ADMIN1, "canton": ADMIN2, "protected_area": SNAP}[kind]
    return {
        "id": id,
        "name": name,
        "kind": kind,
        "province": province,
        "category": extra.get("category"),
        "area_ha": extra.get("area_ha", 1000.0),
        "bbox": [-78.0, -1.1, -77.7, -0.9],
        "source": {"url": url, "layer_id": 0, "where": f"name = '{name}'"},
    }


SNAPSHOT = PlacesSnapshot.model_validate(
    {
        "generated_at": "2026-09-30T10:00:00Z",
        "places": [
            place("province:Pastaza", "Pastaza", "province"),
            place("province:Napo", "Napo", "province"),
            place("canton:Napo/Tena", "Tena", "canton", "Napo"),
            place("canton:Pastaza/Pastaza", "Pastaza", "canton", "Pastaza"),
            place("canton:Pastaza/Mejía", "Mejía", "canton", "Pastaza"),
            place("canton:Pichincha/Mejía", "Mejía", "canton", "Pichincha"),
            place(
                "protected_area:Yasuní",
                "Yasuní",
                "protected_area",
                category="Parque Nacional",
            ),
            place(
                "protected_area:Sumaco Napo-Galeras",
                "Sumaco Napo-Galeras",
                "protected_area",
                category="Parque Nacional",
            ),
        ],
    }
)


@pytest.fixture
def places() -> Places:
    return Places(SNAPSHOT)


def ids(places: Places, query: str, kind: Any = None) -> list[str]:
    return [p.id for p in places.find(query, kind).places]


def test_normalise() -> None:
    assert normalise("  Yasuní\tNational  ") == "yasuni national"


def test_one_canton(places: Places) -> None:
    assert ids(places, "Tena") == ["canton:Napo/Tena"]


def test_a_province_and_a_canton_share_a_name(places: Places) -> None:
    assert ids(places, "Pastaza") == ["province:Pastaza", "canton:Pastaza/Pastaza"]


def test_two_cantons_in_two_provinces(places: Places) -> None:
    assert ids(places, "Mejia") == ["canton:Pastaza/Mejía", "canton:Pichincha/Mejía"]


def test_match_ignores_case_accents_and_spaces(places: Places) -> None:
    assert ids(places, "  TENA ") == ["canton:Napo/Tena"]
    assert ids(places, "yasuni") == ["protected_area:Yasuní"]


def test_whole_word_match_when_no_whole_name_matches(places: Places) -> None:
    assert ids(places, "sumaco") == ["protected_area:Sumaco Napo-Galeras"]
    # "Napo" is a whole name, so the protected area that contains it is not listed.
    assert ids(places, "napo") == ["province:Napo"]


def test_no_part_word_match(places: Places) -> None:
    assert ids(places, "ten") == []


def test_kind_filter(places: Places) -> None:
    assert ids(places, "Pastaza", "canton") == ["canton:Pastaza/Pastaza"]


def test_several_matches_carry_a_note_to_ask(places: Places) -> None:
    note = places.find("Pastaza").note
    assert note is not None and "ask the user" in note


def test_no_match_names_the_kinds_covered(places: Places) -> None:
    matches = places.find("Guayaquil")
    assert matches.places == []
    assert matches.note is not None
    for kind in ("province", "canton", "protected area"):
        assert kind in matches.note


def test_summary_leaves_the_source_out(places: Places) -> None:
    summary = places.find("Tena").places[0]
    assert "source" not in summary.model_dump()


def test_get(places: Places) -> None:
    found = places.get("canton:Napo/Tena")
    assert isinstance(found, Place) and found.name == "Tena"
    assert places.get("canton:Napo/Nowhere") is None


def test_the_committed_snapshot_loads_with_every_kind() -> None:
    from mcp_server.places import load_places

    loaded = load_places()
    kinds = {p.kind for p in loaded.snapshot.places}
    assert kinds == {"province", "canton", "protected_area"}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/test_places.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.places'`

- [ ] **Step 3: Write the models**

`mcp/src/mcp_server/places/models.py`:

```python
from typing import Literal

from pydantic import BaseModel, Field

PlaceKind = Literal["province", "canton", "protected_area"]


class PlaceSource(BaseModel):
    """Where the boundary is read from when a tool uses the place."""

    url: str
    layer_id: int
    where: str


class PlaceSummary(BaseModel):
    id: str = Field(description="Pass as place_id to any area tool.")
    name: str
    kind: PlaceKind
    province: str | None = Field(
        default=None, description="canton only: the province it belongs to."
    )
    category: str | None = Field(
        default=None, description="protected_area only: its category in the SNAP."
    )
    area_ha: float
    bbox: list[float] = Field(description="[min_lon, min_lat, max_lon, max_lat].")


class Place(PlaceSummary):
    source: PlaceSource

    def summary(self) -> PlaceSummary:
        return PlaceSummary.model_validate(self.model_dump(exclude={"source"}))


class PlaceMatches(BaseModel):
    places: list[PlaceSummary]
    note: str | None = None


class PlacesSnapshot(BaseModel):
    generated_at: str
    places: list[Place]
```

- [ ] **Step 4: Write the loader and matching**

`mcp/src/mcp_server/places/__init__.py`:

```python
"""Places a user can name instead of drawing: provinces, cantons, protected areas.

The names come from ``places.snapshot.json``, written by
``amazonia360-mcp-catalogue sync``; the boundaries are read from ArcGIS when a tool
uses a place (``mcp_server.places.geometry``).
"""

import json
import re
import unicodedata
from functools import cache
from importlib.resources import files

from mcp_server.places.models import (
    Place,
    PlaceKind,
    PlaceMatches,
    PlacesSnapshot,
)

SNAPSHOT_FILE = "places.snapshot.json"
_KIND_ORDER: dict[PlaceKind, int] = {"province": 0, "canton": 1, "protected_area": 2}
NO_MATCH = (
    "No province, canton or protected area of the Ecuador module has that name. "
    "Only these three kinds of place can be named; for anything else, send the "
    "area as a GeoJSON polygon."
)
SEVERAL = "Several places match: ask the user which one before calling a tool."


def normalise(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.casefold().split())


class Places:
    def __init__(self, snapshot: PlacesSnapshot) -> None:
        self.snapshot = snapshot
        self._by_id = {p.id: p for p in snapshot.places}

    def get(self, place_id: str) -> Place | None:
        return self._by_id.get(place_id)

    def find(self, query: str, kind: PlaceKind | None = None) -> PlaceMatches:
        q = normalise(query)
        pool = [p for p in self.snapshot.places if kind is None or p.kind == kind]
        found = [p for p in pool if normalise(p.name) == q]
        if not found and q:
            # A whole word, so "Sumaco" finds "Sumaco Napo-Galeras" and "ten" finds
            # nothing.
            word = re.compile(rf"(?<!\w){re.escape(q)}(?!\w)")
            found = [p for p in pool if word.search(normalise(p.name))]
        found.sort(key=lambda p: (_KIND_ORDER[p.kind], p.province or "", p.name))
        note = NO_MATCH if not found else SEVERAL if len(found) > 1 else None
        return PlaceMatches(places=[p.summary() for p in found], note=note)


@cache
def load_places() -> Places:
    text = files(__package__).joinpath(SNAPSHOT_FILE).read_text(encoding="utf-8")
    return Places(PlacesSnapshot.model_validate(json.loads(text)))
```

- [ ] **Step 5: Write a placeholder snapshot so the loader test can run before Task 2**

Task 2 overwrites this file with the real sync output. Write
`mcp/src/mcp_server/places/places.snapshot.json`:

```json
{
  "generated_at": "2026-09-30T00:00:00Z",
  "places": [
    {"id": "province:Napo", "name": "Napo", "kind": "province", "province": null, "category": null, "area_ha": 1251302.2, "bbox": [-78.4, -1.6, -76.9, -0.2], "source": {"url": "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_1/FeatureServer", "layer_id": 4, "where": "GID_0 = 'ECU' AND NAME_1 = 'Napo'"}},
    {"id": "canton:Napo/Tena", "name": "Tena", "kind": "canton", "province": "Napo", "category": null, "area_ha": 389893.0, "bbox": [-78.2, -1.3, -77.4, -0.7], "source": {"url": "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_2/FeatureServer", "layer_id": 6, "where": "GID_0 = 'ECU' AND NAME_1 = 'Napo' AND NAME_2 = 'Tena'"}},
    {"id": "protected_area:Yasuní", "name": "Yasuní", "kind": "protected_area", "province": null, "category": "Parque Nacional", "area_ha": 1029566.3, "bbox": [-76.6, -1.6, -75.4, -0.6], "source": {"url": "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/l_17_sistema_nacional_de_areas_protegidas_del_modulo_ecuatoriano/FeatureServer", "layer_id": 0, "where": "Nombre = 'Yasuní'"}}
  ]
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `uv run pytest tests/test_places.py -v`
Expected: PASS (13 tests)

- [ ] **Step 7: Lint, type-check, commit**

```bash
uv run ruff check . && uv run ruff format --check . && uv run pyright
git add src/mcp_server/places tests/test_places.py
git commit -m "feat(mcp): place names and matching for find_places

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 2: Places sync and the committed snapshot

**Files:**
- Create: `mcp/src/mcp_server/places/sync.py`
- Modify: `mcp/src/mcp_server/catalogue/cli.py` (the `sync` branch of `main`)
- Modify: `mcp/src/mcp_server/places/places.snapshot.json` (overwritten by a real sync)
- Test: `mcp/tests/test_places_sync.py`

**Interfaces:**
- Consumes: `Place`, `PlaceSource`, `PlacesSnapshot`, `SNAPSHOT_FILE` (Task 1); `geodesic_area_ha(geom) -> float` from `mcp_server.geometry.area`.
- Produces:
  - `BoundarySource` (dataclass: `kind`, `url`, `layer_id`, `name_field`, `parent_field: str | None`, `category_field: str | None`, `base_where: str`)
  - `SOURCES: tuple[BoundarySource, ...]`
  - `quote(value: str) -> str` (SQL string literal with doubled quotes)
  - `async sync_places(http: httpx.AsyncClient, now: datetime) -> dict[str, Any]` (raises `httpx.HTTPError` or `PlacesSyncError` when a source cannot be read)
  - `class PlacesSyncError(Exception)`

- [ ] **Step 1: Write the failing tests**

`mcp/tests/test_places_sync.py`:

```python
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest

from mcp_server.places.models import PlacesSnapshot
from mcp_server.places.sync import (
    SOURCES,
    PlacesSyncError,
    quote,
    sync_places,
)

NOW = datetime(2026, 9, 30, 10, 0, tzinfo=UTC)


def square(x: float, y: float, size: float = 0.1) -> dict[str, Any]:
    ring = [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]
    return {"type": "Polygon", "coordinates": [ring]}


FEATURES: dict[str, list[dict[str, Any]]] = {
    "province": [
        {"properties": {"NAME_1": "Napo"}, "geometry": square(-78.0, -1.0)},
    ],
    "canton": [
        {
            "properties": {"NAME_1": "Napo", "NAME_2": "Tena"},
            "geometry": square(-78.0, -1.0),
        },
        {
            "properties": {"NAME_1": "Pastaza", "NAME_2": "Mejía"},
            "geometry": square(-77.0, -2.0),
        },
        {
            "properties": {"NAME_1": "Pichincha", "NAME_2": "Mejía"},
            "geometry": square(-78.6, -0.5),
        },
    ],
    "protected_area": [
        # Two features with one name become one place.
        {
            "properties": {"Nombre": "Yasuní", "Categoria": "Parque Nacional"},
            "geometry": square(-76.0, -1.0),
        },
        {
            "properties": {"Nombre": "Yasuní", "Categoria": "Parque Nacional"},
            "geometry": square(-75.9, -1.0),
        },
    ],
}


def transport(fail: str | None = None) -> httpx.MockTransport:
    urls = {f"{s.url}/{s.layer_id}/query": s.kind for s in SOURCES}

    def handler(request: httpx.Request) -> httpx.Response:
        kind = urls.get(str(request.url).split("?")[0])
        if kind is None:
            return httpx.Response(404)
        if kind == fail:
            return httpx.Response(200, json={"error": {"code": 400, "message": "x"}})
        return httpx.Response(
            200, json={"type": "FeatureCollection", "features": FEATURES[kind]}
        )

    return httpx.MockTransport(handler)


async def run(fail: str | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(transport=transport(fail)) as http:
        return await sync_places(http, NOW)


@pytest.mark.anyio
async def test_writes_every_kind_with_its_id() -> None:
    snapshot = PlacesSnapshot.model_validate(await run())
    ids = [p.id for p in snapshot.places]
    assert ids == [
        "province:Napo",
        "canton:Napo/Tena",
        "canton:Pastaza/Mejía",
        "canton:Pichincha/Mejía",
        "protected_area:Yasuní",
    ]
    assert snapshot.generated_at == "2026-09-30T10:00:00Z"


@pytest.mark.anyio
async def test_a_canton_carries_its_province_and_a_where_that_finds_it() -> None:
    snapshot = PlacesSnapshot.model_validate(await run())
    tena = next(p for p in snapshot.places if p.id == "canton:Napo/Tena")
    assert tena.province == "Napo"
    assert tena.source.where == "GID_0 = 'ECU' AND NAME_1 = 'Napo' AND NAME_2 = 'Tena'"
    assert tena.source.layer_id == 6


@pytest.mark.anyio
async def test_features_with_one_name_are_one_place_with_the_joint_area() -> None:
    snapshot = PlacesSnapshot.model_validate(await run())
    yasuni = next(p for p in snapshot.places if p.kind == "protected_area")
    napo = next(p for p in snapshot.places if p.kind == "province")
    assert yasuni.category == "Parque Nacional"
    # Two 0.1-degree squares, overlapping by half: 1.5 squares.
    assert yasuni.area_ha == pytest.approx(napo.area_ha * 1.5, rel=0.01)
    assert yasuni.bbox == pytest.approx([-76.0, -1.0, -75.8, -0.9])


@pytest.mark.anyio
async def test_a_source_that_fails_fails_the_sync() -> None:
    with pytest.raises(PlacesSyncError):
        await run(fail="canton")


def test_where_doubles_quotes() -> None:
    assert quote("Vírgen del Rosario") == "'Vírgen del Rosario'"
    assert quote("O'Neil") == "'O''Neil'"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/test_places_sync.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.places.sync'`

- [ ] **Step 3: Write the sync**

`mcp/src/mcp_server/places/sync.py`:

```python
"""Reads the place names and their areas from the boundary layers, for find_places.

Run by ``amazonia360-mcp-catalogue sync``. Unlike the catalogue sync, one source that
cannot be read fails the whole run, and the previous snapshot stays.
"""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import httpx
import shapely
from shapely.geometry import shape

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
            "f": "geojson",
        },
    )
    response.raise_for_status()
    body = response.json()
    if "error" in body or "features" not in body:
        raise PlacesSyncError(f"{source.url}/{source.layer_id}: {body}")
    if body.get("exceededTransferLimit") or body.get("properties", {}).get(
        "exceededTransferLimit"
    ):
        raise PlacesSyncError(f"{source.url}/{source.layer_id}: truncated")
    return body["features"]


async def _places(
    http: httpx.AsyncClient, source: BoundarySource
) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for feature in await _features(http, source):
        props = feature.get("properties") or {}
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
        entry["shapes"].append(shape(feature["geometry"]))
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
    except (httpx.HTTPError, ValueError) as exc:
        raise PlacesSyncError(str(exc)) from exc
    stamp = now.astimezone(UTC).isoformat().replace("+00:00", "Z")
    return {"generated_at": stamp, "places": places}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `uv run pytest tests/test_places_sync.py -v`
Expected: PASS (5 tests)

- [ ] **Step 5: Wire it into the `sync` command**

In `mcp/src/mcp_server/catalogue/cli.py`, add the imports:

```python
from mcp_server import places
from mcp_server.places.sync import PlacesSyncError, sync_places
```

Add after `_sync`:

```python
async def _sync_places(timeout_s: float) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=timeout_s) as http:
        now = datetime.now(UTC).replace(microsecond=0)
        return await sync_places(http, now)
```

and at the end of the `if args.command == "sync":` branch, after the loop that prints each indicator:

```python
        try:
            snapshot = asyncio.run(_sync_places(args.timeout))
        except PlacesSyncError as exc:
            print(f"Places not read ({exc}); {places.SNAPSHOT_FILE} left as it was.")
        else:
            write_json(Path(places.__file__).parent / places.SNAPSHOT_FILE, snapshot)
            places.load_places.cache_clear()
            print(f"places: {len(snapshot['places'])}")
```

Update the module docstring's `sync` line to: ``- ``sync`` reads ArcGIS and rewrites ``ecuador.snapshot.json``, the example export and ``places/places.snapshot.json``.``

- [ ] **Step 6: Run the real sync**

Run: `uv run amazonia360-mcp-catalogue sync`
Expected: the indicator statuses, then `places: 151` (16 provinces, 95 cantons, 40 protected areas; a different number means the layers changed, which is fine if the three kinds are present).

Then check: `jq '[.places[].kind] | group_by(.) | map({(.[0]): length}) | add' src/mcp_server/places/places.snapshot.json`
Expected: `province`, `canton` and `protected_area`, all non-zero.

If the catalogue snapshot also changed, keep that diff: it is the normal result of a sync.

- [ ] **Step 7: Full test run, lint, commit**

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check . && uv run pyright
git add src/mcp_server/places src/mcp_server/catalogue tests/test_places_sync.py examples/catalogue.json
git commit -m "feat(mcp): the catalogue sync writes the places snapshot

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 3: Place boundaries from ArcGIS, and the input check split

**Files:**
- Create: `mcp/src/mcp_server/places/geometry.py`
- Modify: `mcp/src/mcp_server/arcgis/client.py` (add `boundary`)
- Modify: `mcp/src/mcp_server/geometry/aoi.py` (split `parse_aoi`)
- Test: `mcp/tests/test_place_geometry.py`, `mcp/tests/test_aoi.py` (add one test)

**Interfaces:**
- Consumes: `Place`, `PlaceSource` (Task 1).
- Produces:
  - `ArcGISClient.boundary(url: str, layer_id: int, where: str) -> list[BaseGeometry]`
  - `check_aoi(geom: BaseGeometry, *, max_vertices: int | None = MAX_VERTICES) -> Polygon | MultiPolygon` in `mcp_server.geometry.aoi`; `parse_aoi(geojson)` now parses and then calls it.
  - `class PlaceGeometries`: `PlaceGeometries(client, *, ttl_s: float = 86_400, clock: Callable[[], float] = time.monotonic)`, `async geometry(place: Place) -> Polygon | MultiPolygon` (raises `ArcGISError`)

- [ ] **Step 1: Write the failing tests**

`mcp/tests/test_place_geometry.py`:

```python
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
```

Add to `mcp/tests/test_aoi.py`:

```python
def test_check_aoi_without_a_vertex_limit() -> None:
    from shapely.geometry import Point

    from mcp_server.geometry.aoi import MAX_VERTICES, check_aoi

    # A circle over Tena with more vertices than a client may send.
    dense = Point(-77.8, -1.0).buffer(0.05, quad_segs=2000)
    assert len(dense.exterior.coords) > MAX_VERTICES
    with pytest.raises(AOIError, match="vertices"):
        check_aoi(dense)
    assert check_aoi(dense, max_vertices=None) is dense
```

(If `test_aoi.py` does not already import `pytest` and `AOIError`, add `import pytest` and `from mcp_server.geometry.aoi import AOIError`.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/test_place_geometry.py tests/test_aoi.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.places.geometry'` and `ImportError: cannot import name 'check_aoi'`

- [ ] **Step 3: Split `parse_aoi`**

In `mcp/src/mcp_server/geometry/aoi.py`, replace `parse_aoi` with:

```python
def parse_aoi(geojson: dict[str, Any]) -> Polygon | MultiPolygon:
    try:
        geom = shape(geojson)
    except (AttributeError, KeyError, ShapelyError, TypeError, ValueError) as exc:
        raise AOIError(f"The area is not valid GeoJSON: {exc}") from exc
    return check_aoi(geom)


def check_aoi(
    geom: BaseGeometry, *, max_vertices: int | None = MAX_VERTICES
) -> Polygon | MultiPolygon:
    """The checks every area goes through. max_vertices=None for a place, whose
    boundary the server reads itself instead of receiving it from the client."""
    if not isinstance(geom, Polygon | MultiPolygon):
        raise AOIError(
            f"The area must be a Polygon or MultiPolygon, got {geom.geom_type}."
        )
    if geom.is_empty:
        raise AOIError("The area is empty: it has no coordinates.")
    min_x, min_y, max_x, max_y = geom.bounds
    # Metres from a projected CRS would otherwise pass and read as "outside".
    if min_x < -180 or max_x > 180 or min_y < -90 or max_y > 90:
        raise AOIError(
            "The area's coordinates are out of range for longitude and latitude; "
            "send it in WGS 84 (EPSG:4326)."
        )
    # Counted before the validity check, which is the costly one.
    vertices = vertex_count(geom)
    if max_vertices is not None and vertices > max_vertices:
        raise AOIError(
            f"The area has {vertices} vertices; the limit is {max_vertices}. "
            "Simplify it before sending."
        )
    reach = MODULE_ENVELOPE.buffer(MAX_REACH_DEG, join_style="mitre")
    if not reach.contains(geom) and reach.intersects(geom):
        raise AOIError(
            f"The area reaches more than {MAX_REACH_DEG:g} degree beyond the Ecuador "
            "module. Draw it over the module; the tools have no data outside it."
        )
    if not geom.is_valid:
        raise AOIError(f"The area is not a valid polygon: {explain_validity(geom)}.")
    return geom
```

- [ ] **Step 4: Add `boundary` to the ArcGIS client**

In `mcp/src/mcp_server/arcgis/client.py`, add this method to `ArcGISClient`, after `features`:

```python
    async def boundary(self, url: str, layer_id: int, where: str) -> list[BaseGeometry]:
        """Every polygon of a boundary layer that the where clause selects."""
        query = f"{url}/{layer_id}/query"
        body = await self._send(
            "POST",
            query,
            data={
                "where": where,
                "returnGeometry": "true",
                "outSR": "4326",
                "f": "geojson",
            },
        )
        try:
            return [
                shape(f["geometry"])
                for f in body["features"]
                if f.get("geometry") is not None
            ]
        except (KeyError, TypeError) as exc:
            raise _invalid(query, "missing features or geometry") from exc
```

- [ ] **Step 5: Write `PlaceGeometries`**

`mcp/src/mcp_server/places/geometry.py`:

```python
import time
from collections.abc import Callable
from typing import Protocol

import shapely
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError
from mcp_server.places.models import Place

DAY_S = 86_400.0


class _Boundaries(Protocol):
    async def boundary(
        self, url: str, layer_id: int, where: str
    ) -> list[BaseGeometry]: ...


def _polygonal(geom: BaseGeometry) -> Polygon | MultiPolygon:
    # make_valid may return lines or points beside the polygons; only area counts.
    if isinstance(geom, GeometryCollection):
        parts = [g for g in geom.geoms if isinstance(g, Polygon | MultiPolygon)]
        geom = shapely.union_all(parts)
    if not isinstance(geom, Polygon | MultiPolygon) or geom.is_empty:
        raise ArcGISError("The place's boundary has no area.")
    return geom


class PlaceGeometries:
    """Boundaries of places, read from ArcGIS on first use and kept for a day."""

    def __init__(
        self,
        client: _Boundaries,
        *,
        ttl_s: float = DAY_S,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._client = client
        self._ttl_s = ttl_s
        self._clock = clock
        self._cache: dict[str, tuple[float, Polygon | MultiPolygon]] = {}

    async def geometry(self, place: Place) -> Polygon | MultiPolygon:
        cached = self._cache.get(place.id)
        if cached is not None and self._clock() - cached[0] < self._ttl_s:
            return cached[1]
        source = place.source
        shapes = await self._client.boundary(source.url, source.layer_id, source.where)
        if not shapes:
            raise ArcGISError(
                f"The boundary of {place.id} is no longer in its layer; call "
                "find_places for the place's current id."
            )
        geom = _polygonal(shapely.make_valid(shapely.union_all(shapes)))
        self._cache[place.id] = (self._clock(), geom)
        return geom
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `uv run pytest tests/test_place_geometry.py tests/test_aoi.py tests/test_arcgis_client.py -v`
Expected: PASS

- [ ] **Step 7: Full test run, lint, commit**

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check . && uv run pyright
git add src/mcp_server/places/geometry.py src/mcp_server/arcgis/client.py src/mcp_server/geometry/aoi.py tests/test_place_geometry.py tests/test_aoi.py
git commit -m "feat(mcp): place boundaries read from ArcGIS and cached for a day

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 4: Handlers take a place

**Files:**
- Modify: `mcp/src/mcp_server/handlers/area.py`
- Modify: `mcp/src/mcp_server/handlers/result.py`
- Test: `mcp/tests/test_handlers.py`

**Interfaces:**
- Consumes: `Places`, `load_places` (Task 1); `PlaceGeometries` (Task 3); `check_aoi` (Task 3).
- Produces:
  - `AreaHandlers(client, simplification=0.001, places: Places | None = None)`; `places` defaults to `load_places()`.
  - Every public handler takes `(indicator_id: int, area: dict[str, Any] | None = None, *, place_id: str | None = None)`: `categories_in_area`, `count_in_area`, `area_by_category`, `area_by_category_map`, `class_shares`, `class_shares_map`.
  - `Result.place: PlaceInfo | None`, with `PlaceInfo(id: str, name: str, kind: PlaceKind, source: str)`.
  - `Timing.place_ms: int = 0`.
  - `CategoryMap.area` and `RasterMap.area`: the area as a GeoJSON geometry dict.

- [ ] **Step 1: Write the failing tests**

In `mcp/tests/test_handlers.py`, add a `boundary` method to `FakeClient` (after `features`):

```python
    async def boundary(self, url: str, layer_id: int, where: str) -> list[BaseGeometry]:
        self.calls.append("boundary")
        return [] if self.empty else [box(-77.9, -1.1, -77.8, -1.0)]
```

Then add at the end of the file:

```python
from mcp_server.places import Places  # noqa: E402
from tests.test_places import SNAPSHOT  # noqa: E402


def with_places(client: FakeClient | None = None) -> AreaHandlers:
    return AreaHandlers(client or FakeClient(), places=Places(SNAPSHOT))  # type: ignore[arg-type]


@pytest.mark.anyio
async def test_a_place_gives_the_same_hectares_as_its_polygon() -> None:
    handlers = with_places()
    by_area = await handlers.area_by_category(210, TENA)
    by_place = await handlers.area_by_category(210, place_id="canton:Napo/Tena")
    assert by_place.value == by_area.value
    assert by_place.aoi_ha == by_area.aoi_ha
    assert by_place.place is not None
    assert by_place.place.id == "canton:Napo/Tena"
    assert by_place.place.kind == "canton"
    assert by_area.place is None


@pytest.mark.anyio
async def test_every_handler_takes_a_place() -> None:
    handlers = with_places()
    place = {"place_id": "canton:Napo/Tena"}
    assert (await handlers.categories_in_area(210, **place)).place is not None
    assert (await handlers.count_in_area(202, **place)).place is not None
    assert (await handlers.class_shares(129, **place)).place is not None
    result, drawn = await handlers.area_by_category_map(210, **place)
    assert result.place is not None and drawn.area["type"] == "Polygon"
    result, raster = await handlers.class_shares_map(129, **place)
    assert result.place is not None and raster.area["type"] == "Polygon"


@pytest.mark.anyio
async def test_the_map_carries_the_area_it_was_computed_over() -> None:
    _, drawn = await with_places().area_by_category_map(210, TENA)
    assert drawn.area["type"] == "Polygon"


@pytest.mark.anyio
async def test_both_area_and_place_are_refused() -> None:
    with pytest.raises(HandlerError, match="not both"):
        await with_places().area_by_category(210, TENA, place_id="canton:Napo/Tena")


@pytest.mark.anyio
async def test_neither_area_nor_place_is_refused() -> None:
    with pytest.raises(HandlerError, match="find_places"):
        await with_places().area_by_category(210)


@pytest.mark.anyio
async def test_an_unknown_place_says_to_search_again() -> None:
    with pytest.raises(HandlerError, match="find_places"):
        await with_places().area_by_category(210, place_id="canton:Napo/Nowhere")


@pytest.mark.anyio
async def test_a_place_that_left_its_layer_says_to_search_again() -> None:
    handlers = with_places(FakeClient(empty=True))
    with pytest.raises(HandlerError, match="find_places"):
        await handlers.categories_in_area(210, place_id="canton:Napo/Tena")


@pytest.mark.anyio
async def test_a_place_is_not_held_to_the_client_vertex_limit() -> None:
    from shapely.geometry import Point

    dense = Point(-77.85, -1.05).buffer(0.04, quad_segs=2000)

    class Dense(FakeClient):
        async def boundary(
            self, url: str, layer_id: int, where: str
        ) -> list[BaseGeometry]:
            return [dense]

    result = await with_places(Dense()).count_in_area(
        202, place_id="canton:Napo/Tena"
    )
    assert result.timing.vertices_sent > 5000
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/test_handlers.py -v`
Expected: the new tests FAIL with `TypeError: AreaHandlers.__init__() got an unexpected keyword argument 'places'`; the old ones still pass.

- [ ] **Step 3: Add `PlaceInfo`, `Result.place` and `Timing.place_ms`**

In `mcp/src/mcp_server/handlers/result.py`, add the import
`from mcp_server.places.models import PlaceKind`, add `place_ms: int = 0` to `Timing` after
`clip_ms`, and add before `class Result`:

```python
class PlaceInfo(BaseModel):
    id: str
    name: str
    kind: PlaceKind
    source: str = Field(description="The layer the boundary was read from.")
```

In `Result`, after `coverage: Coverage`:

```python
    place: PlaceInfo | None = Field(
        default=None,
        description=(
            "Set when the area was named with place_id: the place whose boundary "
            "the figures were computed over."
        ),
    )
```

- [ ] **Step 4: Resolve the area in the handlers**

In `mcp/src/mcp_server/handlers/area.py`:

1. Imports: add `from shapely.geometry import mapping`; add `check_aoi` to the
   `mcp_server.geometry.aoi` import; add `from mcp_server.handlers.result import PlaceInfo` to the
   existing result import; add

   ```python
   from mcp_server.places import Places, load_places
   from mcp_server.places.geometry import PlaceGeometries
   from mcp_server.places.models import Place
   ```

2. Add `area: dict[str, Any]` as the first field of both `CategoryMap` and `RasterMap`, with the
   docstring line "The area as GeoJSON, since a place id in the input carries no geometry."
   appended to each class docstring.

3. In `_Prepared`, add the field `place: Place | None` after `coverage`.

4. Constructor:

   ```python
   def __init__(
       self,
       client: ArcGISClient,
       simplification: float = 0.001,
       places: Places | None = None,
   ) -> None:
       self._client = client
       self._simplification = simplification
       self._places = places if places is not None else load_places()
       self._geometries = PlaceGeometries(client)
       # Renderers change with a republish of the service, not between calls.
       self._renderers: dict[str, dict[str, Any] | None] = {}
   ```

5. Every public method gains `area: dict[str, Any] | None = None, *, place_id: str | None = None`
   in place of `area: dict[str, Any]`, and passes both on. For example:

   ```python
   async def categories_in_area(
       self,
       indicator_id: int,
       area: dict[str, Any] | None = None,
       *,
       place_id: str | None = None,
   ) -> Result:
       p = await self._prepare(indicator_id, area, place_id, "presence")
       ...
   ```

   `count_in_area` the same with `"count"`. `area_by_category` calls
   `self._area_by_category(indicator_id, area, place_id, with_map=False)`, and
   `area_by_category_map` the same with `with_map=True`. `class_shares` and `class_shares_map` call
   `self._class_shares(indicator_id, area, place_id, with_map=...)`. The private
   `_area_by_category` and `_class_shares` take `(self, indicator_id, area, place_id, *, with_map)`
   and call `await self._prepare(indicator_id, area, place_id, "area")` and `"class_share"`.

6. The maps carry the area. In `_area_by_category`:
   `return result, CategoryMap(area=mapping(p.aoi), shapes=collection, styles=styles)`. In
   `_class_shares`: add `area=mapping(p.aoi),` as the first argument of `RasterMap(...)`.

7. Replace the area part of `_prepare` and make it async:

   ```python
   async def _prepare(
       self,
       indicator_id: int,
       area: dict[str, Any] | None,
       place_id: str | None,
       operation: Operation,
   ) -> _Prepared:
       watch = Stopwatch()
       # ... the indicator checks, unchanged ...
       with watch.lap("place"):
           aoi, place = await self._area(area, place_id)
       coverage = module_coverage(aoi)
       if coverage.status == "outside":
           raise HandlerError("The area is outside the Ecuador module.")
       return _Prepared(indicator, aoi, coverage, place, watch)

   async def _area(
       self, area: dict[str, Any] | None, place_id: str | None
   ) -> tuple[Polygon | MultiPolygon, Place | None]:
       if area is not None and place_id is not None:
           raise HandlerError("Give an area or a place_id, not both.")
       if place_id is None:
           if area is None:
               raise HandlerError(
                   "Give an area as GeoJSON, or a place_id from find_places."
               )
           try:
               return parse_aoi(area), None
           except AOIError as exc:
               raise HandlerError(str(exc)) from exc
       place = self._places.get(place_id)
       if place is None:
           raise HandlerError(
               f"Unknown place {place_id!r}. Call find_places for its current id."
           )
       geom = await self._call(self._geometries.geometry(place))
       try:
           return check_aoi(geom, max_vertices=None), place
       except AOIError as exc:
           raise HandlerError(f"The boundary of {place.id}: {exc}") from exc
   ```

8. In `_result`, pass the place and its timing:

   ```python
           place=PlaceInfo(
               id=p.place.id,
               name=p.place.name,
               kind=p.place.kind,
               source=f"{p.place.source.url}/{p.place.source.layer_id}",
           )
           if p.place
           else None,
   ```

   and `place_ms=p.watch.ms("place"),` in `Timing(...)`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `uv run pytest tests/test_handlers.py -v`
Expected: PASS, old and new tests.

- [ ] **Step 6: Full test run, lint, commit**

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check . && uv run pyright
git add src/mcp_server/handlers tests/test_handlers.py
git commit -m "feat(mcp): handlers take a place_id instead of an area

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 5: The `find_places` tool and `place_id` on every area tool

**Files:**
- Create: `mcp/src/mcp_server/tools/places.py`
- Modify: `mcp/src/mcp_server/tools/area.py`
- Modify: `mcp/src/mcp_server/maps/__init__.py`
- Modify: `mcp/src/mcp_server/server.py`
- Test: `mcp/tests/test_tools.py`, `mcp/tests/test_maps.py`

**Interfaces:**
- Consumes: `Places`, `load_places`, `PlaceMatches`, `PlaceKind` (Task 1); the handler signatures (Task 4).
- Produces:
  - `register_place_tools(server: MCPServer, places: Places) -> None`
  - `create_mcp_server(handlers=None, call_log=None, settings=None, *, places: Places | None = None, auth=None, auth_server_provider=None)`
  - In `tools/area.py`: `Area = Annotated[dict[str, Any] | None, ...]`, `PlaceId = Annotated[str | None, ...]`, and `logged_call(call_log, tool, indicator_id, call, result_of, place_id=None)`.
  - The call log records `place_id` on every record.

- [ ] **Step 1: Write the failing tests**

In `mcp/tests/test_tools.py`, change `server()` so both tools and handlers use the test places:

```python
from mcp_server.places import Places
from tests.test_places import SNAPSHOT


def server(tmp_path: Path) -> Any:
    places = Places(SNAPSHOT)
    return create_mcp_server(
        handlers=AreaHandlers(FakeClient(), places=places),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
        places=places,
    )
```

Add `"find_places"` to the set in `test_exposes_the_tools`, and add:

```python
@pytest.mark.anyio
async def test_find_places(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("find_places", {"query": "Pastaza"})
    assert result.structured_content is not None
    found = result.structured_content["places"]
    assert [p["id"] for p in found] == ["province:Pastaza", "canton:Pastaza/Pastaza"]
    assert "ask the user" in result.structured_content["note"]


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
```

In `mcp/tests/test_maps.py`, change `server()` the same way (import `Places` and `SNAPSHOT`, pass
`places=places` to both) and add:

```python
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run pytest tests/test_tools.py tests/test_maps.py -v`
Expected: FAIL with `TypeError: create_mcp_server() got an unexpected keyword argument 'places'`

- [ ] **Step 3: Write the `find_places` tool**

`mcp/src/mcp_server/tools/places.py`:

```python
from typing import Annotated

from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server.places import Places
from mcp_server.places.models import PlaceKind, PlaceMatches

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)


def register_place_tools(server: MCPServer, places: Places) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def find_places(
        query: Annotated[
            str,
            Field(min_length=1, description="A place name, e.g. 'Tena' or 'Yasuní'."),
        ],
        kind: Annotated[
            PlaceKind | None, Field(description="Only places of this kind.")
        ] = None,
    ) -> PlaceMatches:
        """Provinces, cantons and protected areas of the Ecuador module with this
        name. Each match has an id to pass as place_id to any area tool, instead of
        an area. Every match is returned; when there are several, ask the user."""
        return places.find(query, kind)
```

- [ ] **Step 4: `place_id` on the area tools**

In `mcp/src/mcp_server/tools/area.py`:

1. Replace `Area` and add `PlaceId`:

   ```python
   Area = Annotated[
       dict[str, Any] | None,
       Field(
           description=(
               "GeoJSON Polygon or MultiPolygon geometry in WGS84 (EPSG:4326). "
               "Give this or place_id."
           )
       ),
   ]
   PlaceId = Annotated[
       str | None,
       Field(description="A place id from find_places, instead of area."),
   ]
   ```

2. `logged_call` gains a last parameter `place_id: str | None = None`, and each of its three
   `call_log.write({...})` records gains `"place_id": place_id,` after `"indicator_id"`.

3. `run` becomes:

   ```python
       async def run(
           tool: str,
           indicator_id: int,
           call: Callable[..., Awaitable[Result]],
           area: dict[str, Any] | None,
           place_id: str | None,
       ) -> Result:
           return await logged_call(
               call_log,
               tool,
               indicator_id,
               call(indicator_id, area, place_id=place_id),
               lambda r: r,
               place_id,
           )
   ```

4. Each of the four tools takes `area: Area = None, place_id: PlaceId = None` and passes both.
   For example:

   ```python
       @server.tool(annotations=QUERY)
       async def categories_in_area(
           indicator_id: IndicatorId, area: Area = None, place_id: PlaceId = None
       ) -> Result:
           """Which classes of a categorical layer are present in the area. Fast."""
           return await run(
               "categories_in_area",
               indicator_id,
               handlers.categories_in_area,
               area,
               place_id,
           )
   ```

In `mcp/src/mcp_server/maps/__init__.py`, import `PlaceId` beside `Area`, give both map tools
`area: Area = None, place_id: PlaceId = None`, call
`handlers.area_by_category_map(indicator_id, area, place_id=place_id)` and
`handlers.class_shares_map(indicator_id, area, place_id=place_id)`, pass `place_id` as the last
argument of both `logged_call`s, and in `map_area_by_category` start the meta with the area:
`meta: dict[str, Any] = {"area": drawn.area, "styles": drawn.styles}`. (`map_class_shares_in_area`
already sends `asdict(drawn)`, which now holds `area`.)

- [ ] **Step 5: Wire the server**

In `mcp/src/mcp_server/server.py`:

- imports: `from mcp_server.places import Places, load_places` and
  `from mcp_server.tools.places import register_place_tools`;
- `create_mcp_server` gains the keyword-only `places: Places | None = None` (before `auth`);
- body: `places = places or load_places()` before the handlers; the default handlers become
  `AreaHandlers(ArcGISClient(http), places=places)`; after `register_catalogue_tools(server)` add
  `register_place_tools(server, places)`;
- `INSTRUCTIONS`: after the paragraph that starts "Start with list_indicators.", add:

  ```
  A province, canton or protected area of the module can be named instead of drawn:
  find_places returns the places with that name, each with a place_id that every area
  tool takes instead of area. When several places match, ask the user which one.
  ```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `uv run pytest tests/test_tools.py tests/test_maps.py -v`
Expected: PASS

- [ ] **Step 7: Full test run, lint, commit**

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check . && uv run pyright
git add src/mcp_server/tools src/mcp_server/maps/__init__.py src/mcp_server/server.py tests/test_tools.py tests/test_maps.py
git commit -m "feat(mcp): find_places, and place_id on every area tool

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 6: The map pages draw the area from the result

**Files:**
- Modify: `mcp/src/mcp_server/maps/categories.html`
- Modify: `mcp/src/mcp_server/maps/raster.html`

With a `place_id`, the tool input holds no geometry, so the pages take the area from
`_meta.map.area`. The input stays the first source, so an `area` call draws as soon as it is
sent. There are no JavaScript tests yet (listed under Hardening in `mcp/ROADMAP.md`); the check is
by hand in Task 8.

**Interfaces:**
- Consumes: `_meta.map.area` (Task 5).

- [ ] **Step 1: `categories.html`**

In `window.view`, replace `input(args)` and add one line at the top of `result`:

```js
      input(args) {
        drawOnce(args.area);
      },
      async result(result) {
        drawOnce(result._meta?.map?.area);
        // ... the rest of result() unchanged ...
```

and add above `window.view = {`:

```js
    // With a place_id the input has no geometry; the result then carries the area.
    let drawn = false;
    function drawOnce(area) {
      if (drawn || !area) return;
      drawn = true;
      draw(area).catch((e) => window.view.fail(String(e?.message || e)));
    }
```

- [ ] **Step 2: `raster.html`**

The same change: add `drawn` and `drawOnce` above `window.view = {`, make `input(args)` call
`drawOnce(args.area)`, and make the first line of `result(result)` `drawOnce(result._meta?.map?.area);`.
`addImage` already waits for `mapReady` and reads `state.area`, which `draw` sets.

- [ ] **Step 3: Run the map tests and commit**

```bash
uv run pytest tests/test_maps.py tests/test_styles.py tests/test_map_theme.py
git add src/mcp_server/maps
git commit -m "feat(mcp): the map pages draw a place's area from the result

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 7: The `amazonia360` skill

**Files:**
- Create: `mcp/skills/amazonia360/SKILL.md`
- Modify: `mcp/README.md` (a "Skill" section)
- Test: `mcp/tests/test_skill.py`

**Interfaces:**
- Consumes: the tool names (Task 5); the curated catalogue (`mcp_server.catalogue.load_curated`).

- [ ] **Step 1: Write the failing test**

`mcp/tests/test_skill.py`:

```python
import re
from pathlib import Path

import pytest
from mcp import Client

from mcp_server.catalogue import load_curated
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import FakeClient

SKILL = Path(__file__).parents[1] / "skills" / "amazonia360" / "SKILL.md"


def test_frontmatter_names_the_skill_and_says_when_to_use_it() -> None:
    text = SKILL.read_text(encoding="utf-8")
    match = re.match(r"---\n(.*?)\n---\n", text, re.DOTALL)
    assert match is not None
    front = match.group(1)
    assert re.search(r"^name: amazonia360$", front, re.MULTILINE)
    assert re.search(r"^description: .{40,}", front, re.MULTILINE)


@pytest.mark.anyio
async def test_the_skill_names_every_tool(tmp_path: Path) -> None:
    text = SKILL.read_text(encoding="utf-8")
    server = create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )
    async with Client(server) as client:
        names = {t.name for t in (await client.list_tools()).tools}
    missing = {n for n in names if f"`{n}`" not in text}
    assert not missing


def test_every_indicator_the_skill_names_can_be_answered() -> None:
    text = SKILL.read_text(encoding="utf-8")
    answerable = {
        i["id"] for i in load_curated()["indicators"] if i.get("ai_answerable")
    }
    named = {int(n) for n in re.findall(r"\((\d{1,3})\)", text)}
    assert named, "the skill names no indicator"
    assert named <= answerable, named - answerable
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_skill.py -v`
Expected: FAIL with `FileNotFoundError` on `SKILL.md`

- [ ] **Step 3: Write the skill**

`mcp/skills/amazonia360/SKILL.md`:

```markdown
---
name: amazonia360
description: Use when answering questions about the physical and natural environment of the Ecuador module of Amazonia 360 (ecosystems, land and forest cover, deforestation, climate, relief, water) over a province, canton, protected area or drawn area, with the amazonia360 MCP server connected.
---

# Amazonia 360, Ecuador module

The amazonia360 MCP server answers over an area of the Ecuador module: a province, a canton, a
protected area, or a polygon the user draws. Every figure comes from a tool result. Do not
estimate one, and do not build one from two results.

## Order of calls

1. **The area.** If the user names a place, call `find_places`. One match: use its `id` as
   `place_id`. Several matches, such as Pastaza (a province and a canton): ask the user which
   one, naming the kind and the province of each. No match: say that only provinces, cantons
   and protected areas can be named, and ask for the area drawn as GeoJSON.
2. **The indicators.** Call `list_indicators` and pick by description. `describe_indicator`
   gives the unit, the provenance and the caveats of one.
3. **The fast tools first.** `categories_in_area`, `count_in_area` and `class_shares_in_area`
   answer in seconds. Call them in parallel when a question needs several.
4. **The slow one last.** `area_by_category` takes from several seconds to a minute. Call it
   for one indicator at a time, and only when hectares are needed.

## Terms with more than one answer

When the user's word matches more than one indicator, name the candidates, say how they
differ, and pick the one that fits the question, or ask.

| The user says | Candidates |
|---|---|
| biodiversity, nature | Ecosystems (210), Biogeographic Units (219), Flooding Regime (214) |
| forest | Forest cover (119), Land cover (13), Carbon by forest stratum (206), Canopy height (129) |
| deforestation, forest loss | Deforestation 2020–2022 (208): loss in those years, not today's cover |
| climate | Climate Types (218), Bioclimates (204), Thermotypes (217) |
| water | Hydrographic Demarcations (209), Water Recharge Zone (222), Flooding Regime (214) |
| relief, terrain | Geomorphology (211), Slope (7) |

## Reading a result

- **`value`** holds the figures. `computed_over` says what they were computed over, `coverage`
  where the area falls against the module, and `place` which boundary was used when the area
  was named.
- **Unclassified land.** `unclassified_ha` and `unclassified_share` are the part of the area in
  no class. They are not a class. Say how much there is, and do not guess what it is.
- **Pixel shares.** `class_shares_in_area` gives shares of pixels, not hectares. Say how many
  pixels (`computed_over.pixels`) when there are few.
- **Caveats.** `caveats` are known defects written by a person. Quote them unchanged.
- **Separate indicators.** Figures from two indicators describe two layers. Do not add them,
  subtract them or give a range built from both.
- **Coverage.** When `coverage.status` is `partial`, say that part of the area is outside the
  module and has no data.

## Maps

When the user asks to see a result, call `map_area_by_category` or `map_class_shares_in_area`.
They return the same figures as `area_by_category` and `class_shares_in_area`, and the user sees
a map next to the answer. You do not see the map. Do not describe it or say you cannot see it;
comment on the figures.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `uv run pytest tests/test_skill.py -v`
Expected: PASS (3 tests). If the last test fails, an id in the table is not `ai_answerable` in
`ecuador.json`: remove it from the table rather than changing the catalogue.

- [ ] **Step 5: README section**

Add to `mcp/README.md`, after the "Maps" section:

```markdown
## Skill

`skills/amazonia360/SKILL.md` tells the model how to use the tools: the order of calls, what to
do when a place name matches several places, which indicators answer an ambiguous word, and how
to read a result. It is installed by hand:

- Claude Desktop and claude.ai: zip the folder (`cd skills && zip -r amazonia360.zip amazonia360`)
  and upload it under Settings → Capabilities → Skills.
- Claude Code: copy `skills/amazonia360` into `.claude/skills/` of the project, or
  `~/.claude/skills/`.

`tests/test_skill.py` fails when a tool is missing from the skill, or when the skill names an
indicator that cannot be answered.
```

And in the tools list or run section of the README, add a line for `find_places`: "`find_places`
returns provinces, cantons and protected areas by name; every area tool takes the `place_id` it
returns instead of `area`."

- [ ] **Step 6: Full test run, lint, commit**

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check . && uv run pyright
git add skills tests/test_skill.py README.md
git commit -m "feat(mcp): the amazonia360 skill

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
```

---

### Task 8: Live check, the Yasuní measurement, and the docs

**Files:**
- Modify: `mcp/tests/live/test_live_services.py`
- Modify: `docs/superpowers/specs/2026-09-30-mcp-places-and-methodology-design.md` (open question 1, snapshot path)
- Modify: `mcp/ROADMAP.md`

- [ ] **Step 1: A live test**

Append to `mcp/tests/live/test_live_services.py` (it already has the `live` mark and an httpx
client; follow the pattern of its existing tests for creating `ArcGISClient`):

```python
@pytest.mark.live
@pytest.mark.anyio
async def test_a_canton_by_name_answers() -> None:
    import httpx

    from mcp_server.arcgis.client import ArcGISClient
    from mcp_server.handlers.area import AreaHandlers
    from mcp_server.places import load_places

    places = load_places()
    [tena] = places.find("Tena").places
    async with httpx.AsyncClient(timeout=65) as http:
        handlers = AreaHandlers(ArcGISClient(http), places=places)
        result = await handlers.categories_in_area(210, place_id=tena.id)
    assert result.value
    assert result.place is not None and result.place.id == "canton:Napo/Tena"
```

Run: `uv run pytest -m live tests/live -k canton -v`
Expected: PASS

- [ ] **Step 2: Measure the largest protected area**

Run from `mcp/`:

```bash
uv run python - <<'EOF'
import asyncio, httpx
from mcp_server.arcgis.client import ArcGISClient
from mcp_server.handlers.area import AreaHandlers

async def main():
    async with httpx.AsyncClient(timeout=65) as http:
        h = AreaHandlers(ArcGISClient(http))
        for place in ("protected_area:Yasuní", "canton:Napo/Tena"):
            for tool in ("categories_in_area", "area_by_category"):
                try:
                    r = await getattr(h, tool)(210, place_id=place)
                    t = r.timing
                    print(place, tool, t.total_ms, "ms; place", t.place_ms,
                          "arcgis", t.arcgis_ms, "clip", t.clip_ms,
                          "vertices", t.vertices_sent, "->", t.vertices_received)
                except Exception as e:
                    print(place, tool, "FAILED", e)

asyncio.run(main())
EOF
```

Write the numbers down. If Yasuní fails or `area_by_category` takes more than 60 s, stop and
report: generalising the boundary is a decision for the user (open question 1), not part of
this plan.

- [ ] **Step 3: By-hand check of the maps**

Start the server over stdio in Claude Desktop (see the README, "From Claude Desktop"), restart
Desktop, and ask: "Muéstrame en un mapa los ecosistemas del cantón Tena." Check that the model
calls `find_places`, then `map_area_by_category` with `place_id`, and that the map draws the canton
and its classes. Then ask "¿Qué cobertura forestal hay en el Yasuní? Muéstramela en un mapa."
and check the raster map draws with the park dimmed outside. Note what happened for the report.

- [ ] **Step 4: Update the docs**

In the spec:
- change `catalogue/places.snapshot.json` to `places/places.snapshot.json`;
- under open question 1, add one line with the measured times from Step 2, dated.

In `mcp/ROADMAP.md`, move phase 3 from "Now" to "Done" with a one-line summary, if Steps 1 to 3
passed; otherwise leave it under "Now" and add what is left.

- [ ] **Step 5: Commit and push**

```bash
uv run pytest && uv run ruff check . && uv run ruff format --check . && uv run pyright
git add tests/live ../docs/superpowers/specs/2026-09-30-mcp-places-and-methodology-design.md ROADMAP.md
git commit -m "test(mcp): live check of a canton by name; Yasuní timing in the spec

Claude-Session: https://claude.ai/code/session_01Xsa413hbU8kKPRXfjUG8xF"
git push origin feat/mcp-module
```
