# MCP Module, Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local MCP server over stdio that answers presence, count and area questions about the
physical and natural environment layers of the Ecuador module, and records what each answer cost.

**Architecture:** A standalone Python package in `mcp/`, independent of `api/`. Tools are thin
wrappers over handlers; handlers use a code-defined catalogue, an async ArcGIS client and local
geodesic clipping. Every result carries `computed_over`, `coverage` and `timing`, and every call
appends a JSON line to a log.

**Tech Stack:** Python 3.12, uv, `mcp` 2.2 (`MCPServer`), `httpx`, `shapely`, `pyproj`, pydantic
(through `mcp`), pytest with the anyio plugin, Ruff, Pyright.

**Spec:** `docs/superpowers/specs/2026-09-24-mcp-module-design.md`

**Out of this plan:** phase 2 (OAuth, database, deployment) and the gatekeeper evaluation. Each gets
its own plan.

## Global Constraints

- All work lives under `mcp/` except the CI workflow in Task 9. Nothing in `api/` or `client/` changes.
- Python 3.12, managed with uv. Run everything as `uv run ...` from `mcp/`.
- Ruff for lint and format, line length 88, double quotes. Pyright in `standard` mode.
- Type hints on every argument and return. `list[str]`, `X | None`.
- Comments explain why, never what. No commented-out code.
- Import path of the SDK server class: `from mcp.server.mcpserver import MCPServer`. There is no
  `mcp.server.fastmcp` in 2.x.
- Errors a tool reports to the client are raised as
  `mcp.server.mcpserver.exceptions.ToolError`. Any other exception reaches the client as a bare
  "Error executing tool", with the message lost.
- The ArcGIS sum of `Area_ha` over intersecting features is never used: it returns whole polygon
  areas, up to ×42 too large.
- Area is computed geodesically on WGS84 with `pyproj.Geod`, never in degrees.
- Commit after each task, messages in the repo's `type(scope): summary` form with scope `mcp`,
  ending with the line `Claude-Session: https://claude.ai/code/session_01KPdAT8gHug1rbgJTdVCnwD`.

## File map

```
mcp/
├── pyproject.toml
├── README.md
├── .gitignore
├── src/mcp_server/
│   ├── __init__.py
│   ├── __main__.py            stdio entry point
│   ├── config.py              settings read from the environment
│   ├── server.py              create_mcp_server()
│   ├── catalogue/
│   │   ├── __init__.py        get_indicator_metadata(), list_indicators()
│   │   ├── models.py          IndicatorMetadata and its parts
│   │   └── ecuador.py         the 13 in-scope layers
│   ├── geometry/
│   │   ├── __init__.py
│   │   ├── aoi.py             parse and validate the area, module coverage
│   │   └── area.py            geodesic area and clipping by category
│   ├── measurement/
│   │   ├── __init__.py
│   │   ├── stopwatch.py       Stopwatch
│   │   └── call_log.py        CallLog
│   ├── arcgis/
│   │   ├── __init__.py
│   │   └── client.py          ArcGISClient, ArcGISError
│   ├── handlers/
│   │   ├── __init__.py
│   │   ├── errors.py          HandlerError
│   │   ├── result.py          Result and its parts
│   │   └── area.py            AreaHandlers
│   └── tools/
│       ├── __init__.py
│       ├── catalogue.py       register_catalogue_tools()
│       └── area.py            register_area_tools()
└── tests/
    ├── conftest.py
    ├── test_package.py
    ├── test_catalogue.py
    ├── test_aoi.py
    ├── test_area.py
    ├── test_measurement.py
    ├── test_arcgis_client.py
    ├── test_handlers.py
    ├── test_tools.py
    └── live/
        └── test_live_services.py
.github/workflows/mcp-tests.yml
```

---

### Task 1: Package scaffold

**Files:**
- Create: `mcp/pyproject.toml`, `mcp/.gitignore`, `mcp/src/mcp_server/__init__.py`,
  `mcp/tests/conftest.py`, `mcp/tests/test_package.py`

**Interfaces:**
- Produces: importable package `mcp_server` with `__version__: str`; pytest configured with the
  anyio plugin on asyncio and a `live` marker excluded by default.

- [ ] **Step 1: Write `mcp/pyproject.toml`**

```toml
[project]
name = "mcp-server"
version = "0.1.0"
description = "Amazonia 360 MCP server"
readme = "README.md"
requires-python = ">=3.12,<3.13"
dependencies = [
    "mcp>=2.2,<3",
    "httpx>=0.28",
    "shapely>=2.1",
    "pyproj>=3.8",
]

[project.scripts]
amazonia360-mcp = "mcp_server.__main__:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/mcp_server"]

[dependency-groups]
dev = [
    "pytest>=9.1",
    "pyright>=1.1.414",
    "ruff>=0.16",
]

[tool.ruff]
line-length = 88
src = ["src"]

[tool.ruff.lint]
select = ["E", "W", "F", "C", "B", "N", "I", "UP", "RUF"]

[tool.pyright]
include = ["src", "tests"]
typeCheckingMode = "standard"
pythonVersion = "3.12"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra -m 'not live'"
markers = ["live: calls the published ArcGIS services; run with -m live"]
```

- [ ] **Step 2: Write `mcp/.gitignore`**

```
.venv/
.pytest_cache/
.ruff_cache/
var/
```

- [ ] **Step 3: Write the failing test** `mcp/tests/test_package.py`

```python
import mcp_server


def test_package_exposes_a_version() -> None:
    assert mcp_server.__version__ == "0.1.0"
```

And `mcp/tests/conftest.py`, which pins the anyio plugin to asyncio so async tests do not also run
under trio:

```python
import pytest


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
```

- [ ] **Step 4: Run it to verify it fails**

Run: `cd mcp && uv sync && uv run pytest tests/test_package.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server'` or an `AttributeError` on
`__version__`.

- [ ] **Step 5: Write `mcp/src/mcp_server/__init__.py`**

```python
__version__ = "0.1.0"
```

- [ ] **Step 6: Run the test, the linter and the type checker**

Run: `uv run pytest -v && uv run ruff check && uv run ruff format --check && uv run pyright`
Expected: 1 passed; ruff and pyright report no errors.

- [ ] **Step 7: Commit**

```bash
git add mcp/pyproject.toml mcp/uv.lock mcp/.gitignore mcp/src mcp/tests
git commit -m "feat(mcp): scaffold the MCP server package"
```

---

### Task 2: Catalogue

**Files:**
- Create: `mcp/src/mcp_server/catalogue/models.py`, `mcp/src/mcp_server/catalogue/ecuador.py`,
  `mcp/src/mcp_server/catalogue/__init__.py`
- Test: `mcp/tests/test_catalogue.py`

**Interfaces:**
- Produces:
  - `ValueType = Literal["count", "categorical"]`, `Operation = Literal["presence", "count", "area"]`
  - `ALLOWED_OPERATIONS: dict[ValueType, frozenset[Operation]]`
  - `Layer(service_url: str, layer_id: int, category_field: str)`
  - `Provenance(source_org, source_url, license, source_citation, data_vintage)`, all `str | None`
  - `IndicatorMetadata(id, name_en, name_es, subtopic_id, value_type, aggregation, unit,
    ai_answerable, available, layer, arcgis_item_id, provenance, caveats)` with
    `.allows(operation: Operation) -> bool`
  - `get_indicator_metadata(indicator_id: int) -> IndicatorMetadata | None`
  - `list_indicators(subtopic_id: int | None = None) -> list[IndicatorMetadata]`

Field names follow the CMS contract on `feat/cms-indicator-metadata-contract`
(`client/src/cms/fields/metadata.ts`). `value_type` and `aggregation` take values from that
contract's vocabularies; only the ones this phase uses are in the `Literal`. `layer`, `available`
and `category_field` are ours and have no counterpart in the contract yet.

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_catalogue.py`

```python
import pytest

from mcp_server.catalogue import get_indicator_metadata, list_indicators
from mcp_server.catalogue.models import ALLOWED_OPERATIONS

IN_SCOPE_IDS = {202, 203, 204, 206, 208, 209, 210, 211, 214, 217, 218, 219, 222}
MISCOUNTED_IDS = {204, 208, 214, 217, 219}


def test_lists_the_thirteen_in_scope_layers() -> None:
    assert {i.id for i in list_indicators()} == IN_SCOPE_IDS


def test_filters_by_subtopic() -> None:
    assert {i.id for i in list_indicators(subtopic_id=1)} == {209, 211, 222}


def test_unknown_indicator_is_none() -> None:
    assert get_indicator_metadata(999) is None


def test_carbon_is_listed_as_unavailable() -> None:
    carbon = get_indicator_metadata(206)
    assert carbon is not None
    assert carbon.available is False
    assert carbon.layer is None
    assert carbon.caveats


@pytest.mark.parametrize("indicator_id", sorted(MISCOUNTED_IDS))
def test_miscounted_layers_carry_a_caveat(indicator_id: int) -> None:
    indicator = get_indicator_metadata(indicator_id)
    assert indicator is not None
    assert any("records" in c for c in indicator.caveats)


def test_every_available_layer_is_complete() -> None:
    missing = []
    for i in list_indicators():
        if not i.available:
            continue
        if i.layer is None:
            missing.append((i.id, "layer"))
        if not i.unit:
            missing.append((i.id, "unit"))
        if not i.ai_answerable:
            missing.append((i.id, "ai_answerable"))
    assert missing == []


def test_count_layers_do_not_allow_area() -> None:
    assert "area" not in ALLOWED_OPERATIONS["count"]
    restoration = get_indicator_metadata(202)
    assert restoration is not None
    assert restoration.allows("count")
    assert not restoration.allows("area")


def test_categorical_layers_allow_presence_and_area() -> None:
    ecosystems = get_indicator_metadata(210)
    assert ecosystems is not None
    assert ecosystems.allows("presence")
    assert ecosystems.allows("area")
    assert not ecosystems.allows("count")
```

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_catalogue.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.catalogue'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/catalogue/models.py`**

```python
from typing import Literal

from pydantic import BaseModel, ConfigDict

ValueType = Literal["count", "categorical"]
Aggregation = Literal["sum", "none"]
Operation = Literal["presence", "count", "area"]

ALLOWED_OPERATIONS: dict[ValueType, frozenset[Operation]] = {
    "categorical": frozenset({"presence", "area"}),
    "count": frozenset({"count"}),
}


class Layer(BaseModel):
    model_config = ConfigDict(frozen=True)

    service_url: str
    layer_id: int
    category_field: str


class Provenance(BaseModel):
    model_config = ConfigDict(frozen=True)

    source_org: str | None = None
    source_url: str | None = None
    license: str | None = None
    source_citation: str | None = None
    data_vintage: str | None = None


class IndicatorMetadata(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    name_en: str
    name_es: str
    subtopic_id: int
    value_type: ValueType
    aggregation: Aggregation
    unit: str
    # The contract defaults this to false, so every exposed layer sets it on purpose.
    ai_answerable: bool
    available: bool
    layer: Layer | None
    arcgis_item_id: str
    provenance: Provenance = Provenance()
    caveats: tuple[str, ...] = ()

    def allows(self, operation: Operation) -> bool:
        return operation in ALLOWED_OPERATIONS[self.value_type]
```

- [ ] **Step 4: Write `mcp/src/mcp_server/catalogue/ecuador.py`**

Service URLs, item ids and field names come from the published services (checked on 16 September
2026). Carbon has no service; its id 206 is the gap in the module's id sequence that matches the
consultant's layer 07.

```python
from mcp_server.catalogue.models import IndicatorMetadata, Layer

_BASE = "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services"


def _layer(service: str, category_field: str) -> Layer:
    return Layer(
        service_url=f"{_BASE}/{service}/FeatureServer",
        layer_id=0,
        category_field=category_field,
    )


def _miscount(documented: int, published: int) -> str:
    return (
        f"The consultant's file documents {documented} final records inside the "
        f"module; the published service has {published} records."
    )


INDICATORS: tuple[IndicatorMetadata, ...] = (
    IndicatorMetadata(
        id=202,
        name_en="Areas under restoration actions (Ecuador module)",
        name_es="Área Bajo Acciones de Restauración del módulo ecuatoriano",
        subtopic_id=4,
        value_type="count",
        aggregation="sum",
        unit="restoration actions",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "03_%C3%81rea_Bajo_Acciones_de_Restauraci%C3%B3n_del_m%C3%B3dulo_ecuatoriano",
            "Practica",
        ),
        arcgis_item_id="356deac90503414f9ad6d600e352d808",
    ),
    IndicatorMetadata(
        id=203,
        name_en="Restoration priority areas (Ecuador module)",
        name_es="Área Prioritaria de Restauración del módulo ecuatoriano",
        subtopic_id=4,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer(
            "l_04_area_prioritaria_de_restauracion_del_modulo_ecuatoriano", "Prioridad"
        ),
        arcgis_item_id="6f8055ee6abe4e2495f5f5d457597a4e",
    ),
    IndicatorMetadata(
        id=204,
        name_en="Bioclimates (Ecuador module)",
        name_es="Bioclimas del módulo ecuatoriano",
        subtopic_id=8,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_05_bioclimas_del_modulo_ecuatoriano", "Bioclima"),
        arcgis_item_id="4cb214dd5e834c29a1a3d8dd7dc239bf",
        caveats=(_miscount(7, 3),),
    ),
    IndicatorMetadata(
        id=206,
        name_en="Carbon by forest stratum (Ecuador module)",
        name_es="Carbono por estrato de bosque del módulo ecuatoriano",
        subtopic_id=4,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=False,
        available=False,
        layer=None,
        arcgis_item_id="20e987e39350434e992f66f7ec745dba",
        caveats=(
            "Not published: the ArcGIS item returns HTTP 403 and no service exists.",
        ),
    ),
    IndicatorMetadata(
        id=208,
        name_en="Deforestation 2020-2022 (Ecuador module)",
        name_es="Deforestación 2020-2022 del módulo ecuatoriano",
        subtopic_id=4,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_09_deforestacion_2020_2022_del_modulo_ecuatoriano", "Transicion"),
        arcgis_item_id="9ba21668575c4ded909816b18703841b",
        caveats=(_miscount(7, 8),),
    ),
    IndicatorMetadata(
        id=209,
        name_en="Hydrographic Demarcations (Ecuador module)",
        name_es="Demarcaciones Hidrográficas del módulo ecuatoriano",
        subtopic_id=1,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_10_demarcaciones_hidrograficas_del_modulo_ecuatoriano", "Nombre"),
        arcgis_item_id="4e1cf951ff284164b3875c25fe03e9c9",
    ),
    IndicatorMetadata(
        id=210,
        name_en="Ecosystems (Ecuador module)",
        name_es="Ecosistemas del módulo Ecuador",
        subtopic_id=5,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_11_ecosistemas_del_modulo_ecuador", "Ecosistema"),
        arcgis_item_id="1108a9956a9b4076931c5a35e9decf3a",
    ),
    IndicatorMetadata(
        id=211,
        name_en="Geomorphology (Ecuador module)",
        name_es="Geomorfología del módulo ecuatoriano",
        subtopic_id=1,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_12_geomorfologia_del_modulo_ecuatoriano", "Relieve"),
        arcgis_item_id="6612307cd48f47efb455e567a1a7d289",
    ),
    IndicatorMetadata(
        id=214,
        name_en="Flooding Regime (Ecuador module)",
        name_es="Régimen de Inundación del módulo ecuatoriano",
        subtopic_id=5,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_15_regimen_de_inundacion_del_modulo_ecuatoriano", "Regimen"),
        arcgis_item_id="c692c9533c3844dcb06b81721d3ad4d7",
        caveats=(_miscount(7, 14137),),
    ),
    IndicatorMetadata(
        id=217,
        name_en="Thermotypes (Ecuador module)",
        name_es="Termotipos del módulo ecuatoriano",
        subtopic_id=8,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_18_termotipos_del_modulo_ecuatoriano", "Termotipo"),
        arcgis_item_id="56bdc6d89df345f2b5ffffa5959068e9",
        caveats=(_miscount(7, 11),),
    ),
    IndicatorMetadata(
        id=218,
        name_en="Climate Types (Ecuador module)",
        name_es="Tipos de clima del módulo ecuatoriano",
        subtopic_id=8,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_19_ecu_mod_tipos_de_clima", "TIPO_CLIMA"),
        arcgis_item_id="1cb06063ec0c4e65b73ee2e57b302a65",
    ),
    IndicatorMetadata(
        id=219,
        name_en="Biogeographic Units (Ecuador module)",
        name_es="Unidades Biogeográficas del módulo ecuatoriano",
        subtopic_id=5,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_20_unidades_biogeograficas_del_modulo_ecuatoriano", "Sector_bio"),
        arcgis_item_id="7f30afe4c9524140b6a06540955acc70",
        caveats=(_miscount(7, 11),),
    ),
    IndicatorMetadata(
        id=222,
        name_en="Water Recharge Zone (Ecuador module)",
        name_es="Zona de Recarga Hídrica del módulo ecuatoriano",
        subtopic_id=1,
        value_type="categorical",
        aggregation="none",
        unit="ha",
        ai_answerable=True,
        available=True,
        layer=_layer("l_23_zona_de_recarga_hidrica_del_modulo_ecuatoriano", "Nombre"),
        arcgis_item_id="86b76ac2a4c345569d1e08466792f67e",
    ),
)
```

- [ ] **Step 5: Write `mcp/src/mcp_server/catalogue/__init__.py`**

This is the single seam the CMS will replace: only these two functions read `INDICATORS`.

```python
from mcp_server.catalogue.ecuador import INDICATORS
from mcp_server.catalogue.models import IndicatorMetadata

_BY_ID = {i.id: i for i in INDICATORS}


def get_indicator_metadata(indicator_id: int) -> IndicatorMetadata | None:
    return _BY_ID.get(indicator_id)


def list_indicators(subtopic_id: int | None = None) -> list[IndicatorMetadata]:
    return [i for i in INDICATORS if subtopic_id is None or i.subtopic_id == subtopic_id]
```

- [ ] **Step 6: Run the tests**

Run: `uv run pytest tests/test_catalogue.py -v && uv run ruff check && uv run pyright`
Expected: all pass. If ruff flags `E501` on a service name that cannot be split, add
`# noqa: E501` on that line only.

- [ ] **Step 7: Commit**

```bash
git add mcp/src/mcp_server/catalogue mcp/tests/test_catalogue.py
git commit -m "feat(mcp): add the catalogue of in-scope Ecuador layers"
```

---

### Task 3: Area of interest

**Files:**
- Create: `mcp/src/mcp_server/geometry/__init__.py` (empty), `mcp/src/mcp_server/geometry/aoi.py`
- Test: `mcp/tests/test_aoi.py`

**Interfaces:**
- Produces:
  - `AOIError(Exception)`
  - `Coverage` pydantic model: `status: Literal["inside", "partial", "outside"]`,
    `provisional: bool`
  - `MAX_VERTICES: int = 5000`
  - `parse_aoi(geojson: dict[str, Any]) -> Polygon | MultiPolygon` (raises `AOIError`)
  - `module_coverage(aoi: Polygon | MultiPolygon) -> Coverage`
  - `vertex_count(geom: BaseGeometry) -> int`

`MAX_VERTICES` is provisional; the spec sets the real limit from the first measurements. The module
envelope is the extent of the Geomorfología layer, which covers the whole module, until
`ECU_MOD_POLIG_LIMITE_WGS84` is delivered.

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_aoi.py`

```python
from typing import Any

import pytest

from mcp_server.geometry.aoi import (
    MAX_VERTICES,
    AOIError,
    module_coverage,
    parse_aoi,
    vertex_count,
)


def square(x: float, y: float, size: float) -> dict[str, Any]:
    ring = [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]
    return {"type": "Polygon", "coordinates": [ring]}


TENA = square(-77.9, -1.1, 0.2)


def test_parses_a_polygon() -> None:
    aoi = parse_aoi(TENA)
    assert aoi.geom_type == "Polygon"
    assert vertex_count(aoi) == 5


def test_parses_a_multipolygon() -> None:
    multi = {
        "type": "MultiPolygon",
        "coordinates": [TENA["coordinates"], square(-78.5, -2.0, 0.1)["coordinates"]],
    }
    assert parse_aoi(multi).geom_type == "MultiPolygon"


def test_rejects_a_point() -> None:
    with pytest.raises(AOIError, match="Polygon or MultiPolygon"):
        parse_aoi({"type": "Point", "coordinates": [-77.8, -1.0]})


def test_rejects_malformed_geojson() -> None:
    with pytest.raises(AOIError, match="not valid GeoJSON"):
        parse_aoi({"type": "Polygon", "coordinates": "nope"})


def test_rejects_a_self_intersecting_polygon() -> None:
    bowtie = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]],
    }
    with pytest.raises(AOIError, match="Self-intersection"):
        parse_aoi(bowtie)


def test_rejects_too_many_vertices() -> None:
    n = MAX_VERTICES + 1
    ring = [[-77.9 + 0.2 * i / n, -1.1] for i in range(n)]
    ring += [[-77.7, -0.9], [-77.9, -0.9], [-77.9, -1.1]]
    with pytest.raises(AOIError, match="vertices"):
        parse_aoi({"type": "Polygon", "coordinates": [ring]})


def test_coverage_inside() -> None:
    coverage = module_coverage(parse_aoi(TENA))
    assert coverage.status == "inside"
    assert coverage.provisional is True


def test_coverage_partial() -> None:
    straddling = parse_aoi(square(-79.6, -1.0, 0.4))
    assert module_coverage(straddling).status == "partial"


def test_coverage_outside() -> None:
    lima = parse_aoi(square(-77.1, -12.1, 0.2))
    assert module_coverage(lima).status == "outside"
```

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_aoi.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.geometry'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/geometry/aoi.py`**

```python
from typing import Any, Literal

import shapely
from pydantic import BaseModel
from shapely.geometry import MultiPolygon, Polygon, box, shape
from shapely.geometry.base import BaseGeometry
from shapely.validation import explain_validity

MAX_VERTICES = 5000

# Extent of the Geomorfología layer, which covers the whole module. Replace with
# ECU_MOD_POLIG_LIMITE_WGS84 once it is delivered.
MODULE_ENVELOPE = box(-79.428, -5.016, -75.189, 0.729)
MODULE_BOUNDARY_IS_PROVISIONAL = True


class AOIError(Exception):
    pass


class Coverage(BaseModel):
    status: Literal["inside", "partial", "outside"]
    provisional: bool


def vertex_count(geom: BaseGeometry) -> int:
    return int(shapely.get_num_coordinates(geom))


def parse_aoi(geojson: dict[str, Any]) -> Polygon | MultiPolygon:
    try:
        geom = shape(geojson)
    except (AttributeError, KeyError, TypeError, ValueError) as exc:
        raise AOIError(f"The area is not valid GeoJSON: {exc}") from exc
    if not isinstance(geom, Polygon | MultiPolygon):
        raise AOIError(
            f"The area must be a Polygon or MultiPolygon, got {geom.geom_type}."
        )
    if not geom.is_valid:
        raise AOIError(f"The area is not a valid polygon: {explain_validity(geom)}.")
    vertices = vertex_count(geom)
    if vertices > MAX_VERTICES:
        raise AOIError(
            f"The area has {vertices} vertices; the limit is {MAX_VERTICES}. "
            "Simplify it before sending."
        )
    return geom


def module_coverage(aoi: Polygon | MultiPolygon) -> Coverage:
    if MODULE_ENVELOPE.contains(aoi):
        status = "inside"
    elif MODULE_ENVELOPE.intersects(aoi):
        status = "partial"
    else:
        status = "outside"
    return Coverage(status=status, provisional=MODULE_BOUNDARY_IS_PROVISIONAL)
```

- [ ] **Step 4: Run the tests**

Run: `uv run pytest tests/test_aoi.py -v && uv run ruff check && uv run pyright`
Expected: all pass. (`shape()` raises `ValueError` on the malformed input, checked against
shapely 2.1.2.)

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/geometry mcp/tests/test_aoi.py
git commit -m "feat(mcp): validate the area of interest against the module"
```

---

### Task 4: Geodesic area and clipping

**Files:**
- Create: `mcp/src/mcp_server/geometry/area.py`
- Test: `mcp/tests/test_area.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `geodesic_area_ha(geom: BaseGeometry) -> float`
  - `clip_area_by_category(aoi: BaseGeometry, features: list[tuple[str, BaseGeometry]]) ->
    dict[str, float]` — hectares of each category inside the area, categories with no overlap
    omitted.

The second test below is the guard against the ×40 error measured in September: a feature much
larger than the area must contribute only the part inside it.

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_area.py`

```python
import pytest
from shapely.geometry import box

from mcp_server.geometry.area import clip_area_by_category, geodesic_area_ha


def test_one_degree_square_at_the_equator() -> None:
    # 111.32 km × 110.57 km on WGS84, about 1.2309 million hectares.
    assert geodesic_area_ha(box(0, 0, 1, 1)) == pytest.approx(1_230_900, rel=1e-3)


def test_a_large_feature_contributes_only_the_part_inside() -> None:
    aoi = box(-77.9, -1.1, -77.8, -1.0)
    huge = box(-79.0, -2.0, -77.0, 0.0)
    result = clip_area_by_category(aoi, [("Bosque", huge)])
    assert result["Bosque"] == pytest.approx(geodesic_area_ha(aoi), rel=1e-6)
    assert result["Bosque"] < geodesic_area_ha(huge) / 100


def test_sums_features_of_the_same_category() -> None:
    aoi = box(0, 0, 1, 1)
    left = box(-1, 0, 0.5, 1)
    right = box(0.5, 0, 2, 1)
    result = clip_area_by_category(aoi, [("A", left), ("A", right)])
    assert result["A"] == pytest.approx(geodesic_area_ha(aoi), rel=1e-6)


def test_keeps_categories_apart_and_drops_non_overlapping_ones() -> None:
    aoi = box(0, 0, 1, 1)
    result = clip_area_by_category(
        aoi,
        [("A", box(0, 0, 0.5, 1)), ("B", box(0.5, 0, 1, 1)), ("C", box(5, 5, 6, 6))],
    )
    assert set(result) == {"A", "B"}
    assert result["A"] + result["B"] == pytest.approx(geodesic_area_ha(aoi), rel=1e-6)


def test_repairs_an_invalid_feature_instead_of_failing() -> None:
    from shapely.geometry import Polygon

    bowtie = Polygon([(0, 0), (1, 1), (1, 0), (0, 1), (0, 0)])
    result = clip_area_by_category(box(0, 0, 1, 1), [("A", bowtie)])
    assert result["A"] > 0
```

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_area.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.geometry.area'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/geometry/area.py`**

```python
from collections import defaultdict

from pyproj import Geod
from shapely.geometry.base import BaseGeometry
from shapely.validation import make_valid

_GEOD = Geod(ellps="WGS84")
_M2_PER_HA = 10_000


def geodesic_area_ha(geom: BaseGeometry) -> float:
    area_m2, _ = _GEOD.geometry_area_perimeter(geom)
    # pyproj signs the area by ring orientation; only the magnitude matters here.
    return abs(area_m2) / _M2_PER_HA


def clip_area_by_category(
    aoi: BaseGeometry, features: list[tuple[str, BaseGeometry]]
) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    for category, geom in features:
        # The consultant's dissolved polygons are not always valid, and an invalid
        # geometry makes intersection raise or return garbage.
        if not geom.is_valid:
            geom = make_valid(geom)
        inside = geom.intersection(aoi)
        if inside.is_empty:
            continue
        totals[category] += geodesic_area_ha(inside)
    return {c: a for c, a in totals.items() if a > 0}
```

- [ ] **Step 4: Run the tests**

Run: `uv run pytest tests/test_area.py -v && uv run ruff check && uv run pyright`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/geometry/area.py mcp/tests/test_area.py
git commit -m "feat(mcp): clip features to the area and measure them geodesically"
```

---

### Task 5: Measurement

**Files:**
- Create: `mcp/src/mcp_server/measurement/__init__.py` (empty),
  `mcp/src/mcp_server/measurement/stopwatch.py`, `mcp/src/mcp_server/measurement/call_log.py`
- Test: `mcp/tests/test_measurement.py`

**Interfaces:**
- Produces:
  - `Stopwatch()` with `lap(name: str) -> ContextManager[None]` (accumulates across uses),
    `ms(name: str) -> int` (0 if never lapped), `total_ms() -> int`
  - `CallLog(path: Path)` with `write(record: dict[str, Any]) -> None`, appending one JSON line
    and adding an ISO-8601 UTC `ts`

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_measurement.py`

```python
import json
import time
from pathlib import Path

from mcp_server.measurement.call_log import CallLog
from mcp_server.measurement.stopwatch import Stopwatch


def test_laps_accumulate() -> None:
    watch = Stopwatch()
    with watch.lap("arcgis"):
        time.sleep(0.01)
    with watch.lap("arcgis"):
        time.sleep(0.01)
    assert watch.ms("arcgis") >= 20
    assert watch.ms("clip") == 0
    assert watch.total_ms() >= watch.ms("arcgis")


def test_a_lap_is_recorded_when_the_block_raises() -> None:
    watch = Stopwatch()
    try:
        with watch.lap("arcgis"):
            time.sleep(0.01)
            raise RuntimeError
    except RuntimeError:
        pass
    assert watch.ms("arcgis") >= 10


def test_call_log_appends_json_lines(tmp_path: Path) -> None:
    path = tmp_path / "nested" / "calls.jsonl"
    log = CallLog(path)
    log.write({"tool": "count_in_area", "ok": True})
    log.write({"tool": "area_by_category", "ok": False})
    lines = [json.loads(line) for line in path.read_text().splitlines()]
    assert [line["tool"] for line in lines] == ["count_in_area", "area_by_category"]
    assert all(line["ts"].endswith("+00:00") for line in lines)
```

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_measurement.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.measurement'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/measurement/stopwatch.py`**

```python
from collections.abc import Iterator
from contextlib import contextmanager
from time import perf_counter


class Stopwatch:
    def __init__(self) -> None:
        self._start = perf_counter()
        self._laps: dict[str, float] = {}

    @contextmanager
    def lap(self, name: str) -> Iterator[None]:
        started = perf_counter()
        try:
            yield
        finally:
            self._laps[name] = self._laps.get(name, 0.0) + perf_counter() - started

    def ms(self, name: str) -> int:
        return round(self._laps.get(name, 0.0) * 1000)

    def total_ms(self) -> int:
        return round((perf_counter() - self._start) * 1000)
```

- [ ] **Step 4: Write `mcp/src/mcp_server/measurement/call_log.py`**

```python
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


class CallLog:
    def __init__(self, path: Path) -> None:
        self._path = path

    def write(self, record: dict[str, Any]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        line = {"ts": datetime.now(UTC).isoformat(), **record}
        with self._path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
```

- [ ] **Step 5: Run the tests**

Run: `uv run pytest tests/test_measurement.py -v && uv run ruff check && uv run pyright`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add mcp/src/mcp_server/measurement mcp/tests/test_measurement.py
git commit -m "feat(mcp): time each call and log it as a JSON line"
```

---

### Task 6: ArcGIS client

**Files:**
- Create: `mcp/src/mcp_server/arcgis/__init__.py` (empty), `mcp/src/mcp_server/arcgis/client.py`
- Test: `mcp/tests/test_arcgis_client.py`

**Interfaces:**
- Consumes: `Layer` (Task 2).
- Produces:
  - `ArcGISError(Exception)`
  - `Feature = tuple[str, BaseGeometry]`
  - `ArcGISClient(http: httpx.AsyncClient)` with:
    - `async count(layer: Layer, aoi: BaseGeometry) -> int`
    - `async distinct(layer: Layer, aoi: BaseGeometry) -> list[str]` — sorted distinct values of
      `layer.category_field`
    - `async features(layer: Layer, aoi: BaseGeometry, max_allowable_offset: float) ->
      list[Feature]` — every intersecting feature, following pagination

The request shapes below are the ones verified against the Ecosistemas service on 24 September 2026:
geometry as Esri JSON with `inSR=4326`, `returnCountOnly`, `returnDistinctValues`, and `f=geojson`
with `maxAllowableOffset` for geometries. Services page at `maxRecordCount` (2000 on these layers)
and flag `exceededTransferLimit`.

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_arcgis_client.py`

The fake transport answers in the shapes the live services return.

```python
import json
from collections.abc import Callable
from urllib.parse import parse_qs

import httpx
import pytest
from shapely.geometry import box

from mcp_server.arcgis.client import ArcGISClient, ArcGISError
from mcp_server.catalogue.models import Layer

LAYER = Layer(
    service_url="https://example.test/arcgis/rest/services/eco/FeatureServer",
    layer_id=0,
    category_field="Ecosistema",
)
AOI = box(-77.9, -1.1, -77.7, -0.9)

Handler = Callable[[httpx.Request], httpx.Response]


def client_with(handler: Handler) -> ArcGISClient:
    return ArcGISClient(httpx.AsyncClient(transport=httpx.MockTransport(handler)))


def params(request: httpx.Request) -> dict[str, str]:
    # The client sends form-encoded POSTs, so the parameters are in the body.
    return {k: v[0] for k, v in parse_qs(request.content.decode()).items()}


def square_feature(category: str, x: float) -> dict:
    ring = [[x, -1.0], [x + 0.1, -1.0], [x + 0.1, -0.9], [x, -0.9], [x, -1.0]]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [ring]},
        "properties": {"Ecosistema": category},
    }


@pytest.mark.anyio
async def test_count_sends_an_intersects_query_in_wgs84() -> None:
    seen: list[dict[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(params(request))
        return httpx.Response(200, json={"count": 2})

    assert await client_with(handler).count(LAYER, AOI) == 2
    sent = seen[0]
    assert sent["returnCountOnly"] == "true"
    assert sent["spatialRel"] == "esriSpatialRelIntersects"
    assert sent["inSR"] == "4326"
    assert json.loads(sent["geometry"])["spatialReference"] == {"wkid": 4326}


@pytest.mark.anyio
async def test_distinct_returns_sorted_values() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert params(request)["returnDistinctValues"] == "true"
        return httpx.Response(
            200,
            json={
                "features": [
                    {"attributes": {"Ecosistema": "Páramo"}},
                    {"attributes": {"Ecosistema": "Bosque"}},
                ]
            },
        )

    assert await client_with(handler).distinct(LAYER, AOI) == ["Bosque", "Páramo"]


@pytest.mark.anyio
async def test_features_follow_pagination() -> None:
    pages = {
        "0": {
            "type": "FeatureCollection",
            "features": [square_feature("A", -77.9)],
            "properties": {"exceededTransferLimit": True},
        },
        "1": {"type": "FeatureCollection", "features": [square_feature("B", -77.8)]},
    }

    def handler(request: httpx.Request) -> httpx.Response:
        sent = params(request)
        assert sent["f"] == "geojson"
        assert sent["maxAllowableOffset"] == "0.001"
        return httpx.Response(200, json=pages[sent["resultOffset"]])

    features = await client_with(handler).features(LAYER, AOI, 0.001)
    assert [c for c, _ in features] == ["A", "B"]
    assert features[0][1].geom_type == "Polygon"


@pytest.mark.anyio
async def test_an_arcgis_error_body_raises() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"error": {"code": 400, "message": "Invalid query"}}
        )

    with pytest.raises(ArcGISError, match="Invalid query"):
        await client_with(handler).count(LAYER, AOI)


@pytest.mark.anyio
async def test_a_timeout_raises_instead_of_returning_partial_results() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(ArcGISError, match="did not respond"):
        await client_with(handler).features(LAYER, AOI, 0.001)
```

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_arcgis_client.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.arcgis'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/arcgis/client.py`**

```python
import json
from typing import Any

import httpx
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry
from shapely.geometry.polygon import orient

from mcp_server.catalogue.models import Layer

Feature = tuple[str, BaseGeometry]


class ArcGISError(Exception):
    pass


def _esri_polygon(aoi: BaseGeometry) -> str:
    polygons = list(aoi.geoms) if isinstance(aoi, MultiPolygon) else [aoi]
    rings: list[list[list[float]]] = []
    for polygon in polygons:
        if not isinstance(polygon, Polygon):
            raise ArcGISError(f"Cannot query with a {polygon.geom_type}.")
        # Esri expects clockwise exterior rings; orient(sign=-1) produces that.
        coords = mapping(orient(polygon, sign=-1.0))["coordinates"]
        rings.extend([list(map(list, ring)) for ring in coords])
    return json.dumps({"rings": rings, "spatialReference": {"wkid": 4326}})


class ArcGISClient:
    def __init__(self, http: httpx.AsyncClient) -> None:
        self._http = http

    async def count(self, layer: Layer, aoi: BaseGeometry) -> int:
        body = await self._query(layer, aoi, {"returnCountOnly": "true", "f": "json"})
        return int(body["count"])

    async def distinct(self, layer: Layer, aoi: BaseGeometry) -> list[str]:
        body = await self._query(
            layer,
            aoi,
            {
                "outFields": layer.category_field,
                "returnDistinctValues": "true",
                "returnGeometry": "false",
                "f": "json",
            },
        )
        values = {f["attributes"][layer.category_field] for f in body["features"]}
        return sorted(str(v) for v in values if v is not None)

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        collected: list[Feature] = []
        offset = 0
        while True:
            body = await self._query(
                layer,
                aoi,
                {
                    "outFields": layer.category_field,
                    "returnGeometry": "true",
                    "outSR": "4326",
                    "maxAllowableOffset": str(max_allowable_offset),
                    "resultOffset": str(offset),
                    "f": "geojson",
                },
            )
            page = body.get("features", [])
            for f in page:
                if f.get("geometry") is None:
                    continue
                category = str(f["properties"][layer.category_field])
                collected.append((category, shape(f["geometry"])))
            exceeded = body.get("exceededTransferLimit") or body.get(
                "properties", {}
            ).get("exceededTransferLimit")
            if not exceeded or not page:
                return collected
            offset += len(page)

    async def _query(
        self, layer: Layer, aoi: BaseGeometry, extra: dict[str, str]
    ) -> dict[str, Any]:
        url = f"{layer.service_url}/{layer.layer_id}/query"
        params = {
            "where": "1=1",
            "geometry": _esri_polygon(aoi),
            "geometryType": "esriGeometryPolygon",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            **extra,
        }
        try:
            # POST, because an area near the vertex limit does not fit in a URL.
            response = await self._http.post(url, data=params)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ArcGISError(f"ArcGIS did not respond in time: {url}") from exc
        except httpx.HTTPError as exc:
            raise ArcGISError(f"ArcGIS request failed: {exc}") from exc
        body = response.json()
        if "error" in body:
            raise ArcGISError(f"ArcGIS returned an error: {body['error'].get('message')}")
        return body
```

- [ ] **Step 4: Run the tests**

Run: `uv run pytest tests/test_arcgis_client.py -v && uv run ruff check && uv run pyright`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/arcgis mcp/tests/test_arcgis_client.py
git commit -m "feat(mcp): add an async client for the published feature services"
```

---

### Task 7: Handlers

**Files:**
- Create: `mcp/src/mcp_server/handlers/__init__.py` (empty), `mcp/src/mcp_server/handlers/errors.py`,
  `mcp/src/mcp_server/handlers/result.py`, `mcp/src/mcp_server/handlers/area.py`
- Test: `mcp/tests/test_handlers.py`

**Interfaces:**
- Consumes: `get_indicator_metadata`, `IndicatorMetadata`, `Operation` (Task 2); `parse_aoi`,
  `module_coverage`, `vertex_count`, `Coverage`, `AOIError` (Task 3); `clip_area_by_category`,
  `geodesic_area_ha` (Task 4); `Stopwatch` (Task 5); `ArcGISClient`, `ArcGISError`, `Feature`
  (Task 6).
- Produces:
  - `HandlerError(Exception)`
  - `ComputedOver(type: Literal["feature_attributes", "feature_count", "clipped_polygons"],
    features: int, simplification: float | None = None)`
  - `Timing(total_ms: int, arcgis_ms: int, clip_ms: int = 0, vertices_sent: int,
    vertices_received: int = 0)`
  - `Result(indicator_id: int, value: list[str] | int | dict[str, float], unit: str | None,
    computed_over: ComputedOver, coverage: Coverage, provenance: dict[str, str | None],
    caveats: list[str], aoi_ha: float, timing: Timing)`
  - `AreaHandlers(client: ArcGISClient, simplification: float = 0.001)` with
    `async categories_in_area(indicator_id: int, area: dict[str, Any]) -> Result`,
    `async count_in_area(...) -> Result`, `async area_by_category(...) -> Result`

`Result.aoi_ha` is not in the spec's example envelope; it is what the call log needs to relate
latency to the size of the question, and it costs nothing to return.

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_handlers.py`

The handlers are tested against a fake client with the same methods as `ArcGISClient`, so these
tests say nothing about HTTP and everything about the rules.

```python
from typing import Any

import pytest
from shapely.geometry import box
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError, Feature
from mcp_server.catalogue.models import Layer
from mcp_server.geometry.area import geodesic_area_ha
from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError

TENA: dict[str, Any] = {
    "type": "Polygon",
    "coordinates": [
        [[-77.9, -1.1], [-77.8, -1.1], [-77.8, -1.0], [-77.9, -1.0], [-77.9, -1.1]]
    ],
}
LIMA: dict[str, Any] = {
    "type": "Polygon",
    "coordinates": [
        [[-77.1, -12.1], [-77.0, -12.1], [-77.0, -12.0], [-77.1, -12.0], [-77.1, -12.1]]
    ],
}


class FakeClient:
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.calls: list[str] = []

    async def count(self, layer: Layer, aoi: BaseGeometry) -> int:
        self.calls.append("count")
        return 3

    async def distinct(self, layer: Layer, aoi: BaseGeometry) -> list[str]:
        self.calls.append("distinct")
        if self.fail:
            raise ArcGISError("ArcGIS did not respond in time: x")
        return ["Bosque", "Páramo"]

    async def features(
        self, layer: Layer, aoi: BaseGeometry, max_allowable_offset: float
    ) -> list[Feature]:
        self.calls.append("features")
        return [("Bosque", box(-79.0, -2.0, -77.0, 0.0))]


def handlers(client: FakeClient | None = None) -> AreaHandlers:
    return AreaHandlers(client or FakeClient())  # type: ignore[arg-type]


@pytest.mark.anyio
async def test_categories_in_area() -> None:
    result = await handlers().categories_in_area(210, TENA)
    assert result.value == ["Bosque", "Páramo"]
    assert result.computed_over.type == "feature_attributes"
    assert result.computed_over.features == 2
    assert result.coverage.status == "inside"
    assert result.timing.vertices_sent == 5


@pytest.mark.anyio
async def test_count_in_area() -> None:
    result = await handlers().count_in_area(202, TENA)
    assert result.value == 3
    assert result.computed_over.type == "feature_count"
    assert result.unit == "restoration actions"


@pytest.mark.anyio
async def test_area_by_category_is_clipped_not_whole_polygons() -> None:
    result = await handlers().area_by_category(210, TENA)
    assert isinstance(result.value, dict)
    aoi_ha = geodesic_area_ha(box(-77.9, -1.1, -77.8, -1.0))
    assert result.value["Bosque"] == pytest.approx(aoi_ha, rel=1e-6)
    assert result.computed_over.type == "clipped_polygons"
    assert result.computed_over.simplification == 0.001
    assert result.timing.vertices_received > 0


@pytest.mark.anyio
async def test_known_defects_travel_with_the_result() -> None:
    result = await handlers().categories_in_area(204, TENA)
    assert any("records" in c for c in result.caveats)


@pytest.mark.anyio
async def test_partial_coverage_adds_a_caveat() -> None:
    straddling = {
        "type": "Polygon",
        "coordinates": [
            [[-79.6, -1.0], [-79.2, -1.0], [-79.2, -0.6], [-79.6, -0.6], [-79.6, -1.0]]
        ],
    }
    result = await handlers().categories_in_area(210, straddling)
    assert result.coverage.status == "partial"
    assert any("partly outside" in c for c in result.caveats)
    assert any("provisional" in c for c in result.caveats)


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("call", "indicator_id", "area", "message"),
    [
        ("categories_in_area", 999, TENA, "Unknown indicator"),
        ("categories_in_area", 206, TENA, "not available"),
        ("area_by_category", 202, TENA, "does not support area"),
        ("count_in_area", 210, TENA, "does not support count"),
        ("categories_in_area", 210, LIMA, "outside the Ecuador module"),
        ("categories_in_area", 210, {"type": "Point", "coordinates": [0, 0]}, "Polygon"),
    ],
)
async def test_refusals_happen_before_any_network_call(
    call: str, indicator_id: int, area: dict[str, Any], message: str
) -> None:
    client = FakeClient()
    with pytest.raises(HandlerError, match=message):
        await getattr(handlers(client), call)(indicator_id, area)
    assert client.calls == []


@pytest.mark.anyio
async def test_an_arcgis_failure_is_an_error_not_an_empty_result() -> None:
    with pytest.raises(HandlerError, match="did not respond"):
        await handlers(FakeClient(fail=True)).categories_in_area(210, TENA)
```

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_handlers.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.handlers'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/handlers/errors.py`**

```python
class HandlerError(Exception):
    pass
```

- [ ] **Step 4: Write `mcp/src/mcp_server/handlers/result.py`**

```python
from typing import Literal

from pydantic import BaseModel

from mcp_server.geometry.aoi import Coverage


class ComputedOver(BaseModel):
    type: Literal["feature_attributes", "feature_count", "clipped_polygons"]
    features: int
    simplification: float | None = None


class Timing(BaseModel):
    total_ms: int
    arcgis_ms: int
    clip_ms: int = 0
    vertices_sent: int
    vertices_received: int = 0


class Result(BaseModel):
    indicator_id: int
    value: list[str] | int | dict[str, float]
    unit: str | None
    computed_over: ComputedOver
    coverage: Coverage
    provenance: dict[str, str | None]
    caveats: list[str]
    aoi_ha: float
    timing: Timing
```

- [ ] **Step 5: Write `mcp/src/mcp_server/handlers/area.py`**

```python
from collections.abc import Awaitable
from dataclasses import dataclass
from typing import Any

from shapely.geometry import MultiPolygon, Polygon

from mcp_server.arcgis.client import ArcGISClient, ArcGISError
from mcp_server.catalogue import get_indicator_metadata
from mcp_server.catalogue.models import IndicatorMetadata, Layer, Operation
from mcp_server.geometry.aoi import (
    AOIError,
    Coverage,
    module_coverage,
    parse_aoi,
    vertex_count,
)
from mcp_server.geometry.area import clip_area_by_category, geodesic_area_ha
from mcp_server.handlers.errors import HandlerError
from mcp_server.handlers.result import ComputedOver, Result, Timing
from mcp_server.measurement.stopwatch import Stopwatch


@dataclass
class _Prepared:
    indicator: IndicatorMetadata
    layer: Layer
    aoi: Polygon | MultiPolygon
    coverage: Coverage
    caveats: list[str]
    watch: Stopwatch


class AreaHandlers:
    def __init__(self, client: ArcGISClient, simplification: float = 0.001) -> None:
        self._client = client
        self._simplification = simplification

    async def categories_in_area(self, indicator_id: int, area: dict[str, Any]) -> Result:
        p = self._prepare(indicator_id, area, "presence")
        with p.watch.lap("arcgis"):
            values = await self._call(self._client.distinct(p.layer, p.aoi))
        return self._result(
            p, values, None, ComputedOver(type="feature_attributes", features=len(values))
        )

    async def count_in_area(self, indicator_id: int, area: dict[str, Any]) -> Result:
        p = self._prepare(indicator_id, area, "count")
        with p.watch.lap("arcgis"):
            n = await self._call(self._client.count(p.layer, p.aoi))
        return self._result(
            p, n, p.indicator.unit, ComputedOver(type="feature_count", features=n)
        )

    async def area_by_category(self, indicator_id: int, area: dict[str, Any]) -> Result:
        p = self._prepare(indicator_id, area, "area")
        with p.watch.lap("arcgis"):
            features = await self._call(
                self._client.features(p.layer, p.aoi, self._simplification)
            )
        with p.watch.lap("clip"):
            hectares = clip_area_by_category(p.aoi, features)
        received = sum(vertex_count(g) for _, g in features)
        computed_over = ComputedOver(
            type="clipped_polygons",
            features=len(features),
            simplification=self._simplification,
        )
        return self._result(p, hectares, "ha", computed_over, received)

    def _prepare(
        self, indicator_id: int, area: dict[str, Any], operation: Operation
    ) -> _Prepared:
        watch = Stopwatch()
        indicator = get_indicator_metadata(indicator_id)
        if indicator is None:
            raise HandlerError(f"Unknown indicator {indicator_id}.")
        if not indicator.available or indicator.layer is None:
            reason = " ".join(indicator.caveats)
            raise HandlerError(f"Indicator {indicator_id} is not available. {reason}")
        if not indicator.ai_answerable:
            raise HandlerError(f"Indicator {indicator_id} is not cleared for answers.")
        if not indicator.allows(operation):
            raise HandlerError(
                f"Indicator {indicator_id} is {indicator.value_type} and does not "
                f"support {operation}."
            )
        try:
            aoi = parse_aoi(area)
        except AOIError as exc:
            raise HandlerError(str(exc)) from exc
        coverage = module_coverage(aoi)
        if coverage.status == "outside":
            raise HandlerError("The area is outside the Ecuador module.")
        caveats = list(indicator.caveats)
        if coverage.status == "partial":
            caveats.append(
                "The area is partly outside the Ecuador module; only the part inside "
                "has data."
            )
        if coverage.provisional and coverage.status != "inside":
            caveats.append(
                "The module boundary used for this check is a provisional envelope."
            )
        return _Prepared(indicator, indicator.layer, aoi, coverage, caveats, watch)

    @staticmethod
    async def _call[T](awaitable: Awaitable[T]) -> T:
        try:
            return await awaitable
        except ArcGISError as exc:
            raise HandlerError(str(exc)) from exc

    @staticmethod
    def _result(
        p: _Prepared,
        value: list[str] | int | dict[str, float],
        unit: str | None,
        computed_over: ComputedOver,
        vertices_received: int = 0,
    ) -> Result:
        return Result(
            indicator_id=p.indicator.id,
            value=value,
            unit=unit,
            computed_over=computed_over,
            coverage=p.coverage,
            provenance=p.indicator.provenance.model_dump(),
            caveats=p.caveats,
            aoi_ha=round(geodesic_area_ha(p.aoi), 2),
            timing=Timing(
                total_ms=p.watch.total_ms(),
                arcgis_ms=p.watch.ms("arcgis"),
                clip_ms=p.watch.ms("clip"),
                vertices_sent=vertex_count(p.aoi),
                vertices_received=vertices_received,
            ),
        )
```

The provisional-boundary caveat is only added when the envelope decided something (`partial`);
for `inside` the `coverage.provisional` flag already says it, without noise on every answer.

- [ ] **Step 6: Run the tests**

Run: `uv run pytest tests/test_handlers.py -v && uv run ruff check && uv run pyright`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add mcp/src/mcp_server/handlers mcp/tests/test_handlers.py
git commit -m "feat(mcp): add the area handlers with their refusal rules"
```

---

### Task 8: Tools, server and stdio entry point

**Files:**
- Create: `mcp/src/mcp_server/config.py`, `mcp/src/mcp_server/tools/__init__.py` (empty),
  `mcp/src/mcp_server/tools/catalogue.py`, `mcp/src/mcp_server/tools/area.py`,
  `mcp/src/mcp_server/server.py`, `mcp/src/mcp_server/__main__.py`, `mcp/README.md`
- Test: `mcp/tests/test_tools.py`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `Settings` dataclass with `call_log_path: Path`, `arcgis_timeout_s: float`, and
    `Settings.from_env() -> Settings` reading `MCP_CALL_LOG` (default `var/calls.jsonl`) and
    `ARCGIS_TIMEOUT_S` (default `60`)
  - `create_mcp_server(handlers: AreaHandlers | None = None, call_log: CallLog | None = None,
    settings: Settings | None = None) -> MCPServer`
  - Tools: `list_indicators`, `describe_indicator`, `categories_in_area`, `count_in_area`,
    `area_by_category`
  - `main() -> None`, the `amazonia360-mcp` script, runs over stdio

- [ ] **Step 1: Write the failing tests** `mcp/tests/test_tools.py`

They go through the SDK's in-memory `Client`, which exercises the real tool registrations and
schemas without a subprocess.

```python
import json
from pathlib import Path
from typing import Any

import pytest
from mcp import Client

from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import TENA, FakeClient


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
    ids = {i["id"] for i in result.structured_content["indicators"]}
    assert ids == {209, 211, 222}


@pytest.mark.anyio
async def test_describe_unknown_indicator_is_a_tool_error(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool("describe_indicator", {"indicator_id": 999})
    assert result.is_error
    assert "Unknown indicator 999" in result.content[0].text


@pytest.mark.anyio
async def test_area_tool_returns_the_envelope_and_logs_the_call(tmp_path: Path) -> None:
    async with Client(server(tmp_path)) as client:
        result = await client.call_tool(
            "area_by_category", {"indicator_id": 210, "area": TENA}
        )
    assert not result.is_error
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
    assert "does not support count" in result.content[0].text
    record = json.loads((tmp_path / "calls.jsonl").read_text())
    assert record["ok"] is False
    assert "does not support count" in record["error"]
```

Add `mcp/tests/__init__.py` (empty) so `from tests.test_handlers import ...` resolves, and add
`pythonpath = ["."]` to `[tool.pytest.ini_options]` in `mcp/pyproject.toml`.

- [ ] **Step 2: Run them to verify they fail**

Run: `uv run pytest tests/test_tools.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server.server'`.

- [ ] **Step 3: Write `mcp/src/mcp_server/config.py`**

```python
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    call_log_path: Path
    arcgis_timeout_s: float

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            call_log_path=Path(os.environ.get("MCP_CALL_LOG", "var/calls.jsonl")),
            arcgis_timeout_s=float(os.environ.get("ARCGIS_TIMEOUT_S", "60")),
        )
```

- [ ] **Step 4: Write `mcp/src/mcp_server/tools/catalogue.py`**

```python
from typing import Annotated, Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server import catalogue

_READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)


def register_catalogue_tools(server: MCPServer) -> None:
    @server.tool(annotations=_READ_ONLY)
    async def list_indicators(
        subtopic_id: Annotated[
            int | None, Field(description="Only indicators in this subtopic.")
        ] = None,
    ) -> dict[str, Any]:
        """List the Ecuador module indicators this server can answer about."""
        return {
            "indicators": [
                i.model_dump(include={"id", "name_en", "name_es", "subtopic_id",
                                      "value_type", "available"})
                for i in catalogue.list_indicators(subtopic_id)
            ]
        }

    @server.tool(annotations=_READ_ONLY)
    async def describe_indicator(
        indicator_id: Annotated[int, Field(description="Indicator id.")],
    ) -> dict[str, Any]:
        """Unit, value type, provenance and known caveats of one indicator."""
        indicator = catalogue.get_indicator_metadata(indicator_id)
        if indicator is None:
            raise ToolError(f"Unknown indicator {indicator_id}.")
        return indicator.model_dump(exclude={"layer"})
```

- [ ] **Step 5: Write `mcp/src/mcp_server/tools/area.py`**

The logging wrapper lives here, not in the handlers, so the handlers stay free of I/O they do not
need and the future REST router can log differently.

```python
from collections.abc import Awaitable, Callable
from typing import Annotated, Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from mcp_server.handlers.area import AreaHandlers
from mcp_server.handlers.errors import HandlerError
from mcp_server.handlers.result import Result
from mcp_server.measurement.call_log import CallLog

_QUERY = ToolAnnotations(read_only_hint=True, open_world_hint=True)

IndicatorId = Annotated[int, Field(description="Indicator id from list_indicators.")]
Area = Annotated[
    dict[str, Any],
    Field(description="GeoJSON Polygon or MultiPolygon geometry in WGS84 (EPSG:4326)."),
]


def register_area_tools(
    server: MCPServer, handlers: AreaHandlers, call_log: CallLog
) -> None:
    async def run(
        tool: str,
        indicator_id: int,
        call: Callable[[int, dict[str, Any]], Awaitable[Result]],
        area: dict[str, Any],
    ) -> dict[str, Any]:
        try:
            result = await call(indicator_id, area)
        except HandlerError as exc:
            call_log.write(
                {"tool": tool, "indicator_id": indicator_id, "ok": False, "error": str(exc)}
            )
            raise ToolError(str(exc)) from exc
        call_log.write(
            {
                "tool": tool,
                "indicator_id": indicator_id,
                "ok": True,
                "aoi_ha": result.aoi_ha,
                "features": result.computed_over.features,
                "timing": result.timing.model_dump(),
            }
        )
        return result.model_dump()

    @server.tool(annotations=_QUERY)
    async def categories_in_area(indicator_id: IndicatorId, area: Area) -> dict[str, Any]:
        """Which classes of a categorical layer are present in the area. Fast."""
        return await run(
            "categories_in_area", indicator_id, handlers.categories_in_area, area
        )

    @server.tool(annotations=_QUERY)
    async def count_in_area(indicator_id: IndicatorId, area: Area) -> dict[str, Any]:
        """How many discrete features of a count layer fall in the area. Fast."""
        return await run("count_in_area", indicator_id, handlers.count_in_area, area)

    @server.tool(annotations=_QUERY)
    async def area_by_category(indicator_id: IndicatorId, area: Area) -> dict[str, Any]:
        """Hectares of each class inside the area, clipped to it.

        Slow: several seconds to tens of seconds per call. Ask for one indicator at a
        time.
        """
        return await run(
            "area_by_category", indicator_id, handlers.area_by_category, area
        )
```

- [ ] **Step 6: Write `mcp/src/mcp_server/server.py`**

```python
import httpx
from mcp.server.mcpserver import MCPServer

from mcp_server import __version__
from mcp_server.arcgis.client import ArcGISClient
from mcp_server.config import Settings
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.tools.area import register_area_tools
from mcp_server.tools.catalogue import register_catalogue_tools

INSTRUCTIONS = """\
Answers questions about the physical and natural environment of the Ecuador module of
Amazonia 360, over an area the user provides as a GeoJSON polygon.

Start with list_indicators. Use categories_in_area and count_in_area first; they are
fast. area_by_category is slow and should be called for one indicator at a time.

Every answer says what it was computed over (computed_over) and carries caveats. Quote
the caveats when you use the number, and never combine figures from different
indicators into one total.
"""


def create_mcp_server(
    handlers: AreaHandlers | None = None,
    call_log: CallLog | None = None,
    settings: Settings | None = None,
) -> MCPServer:
    settings = settings or Settings.from_env()
    if handlers is None:
        http = httpx.AsyncClient(timeout=settings.arcgis_timeout_s)
        handlers = AreaHandlers(ArcGISClient(http))
    call_log = call_log or CallLog(settings.call_log_path)

    server = MCPServer(
        name="amazonia360",
        title="Amazonia 360 — Ecuador module",
        instructions=INSTRUCTIONS,
        version=__version__,
    )
    register_catalogue_tools(server)
    register_area_tools(server, handlers, call_log)
    return server
```

- [ ] **Step 7: Write `mcp/src/mcp_server/__main__.py`**

```python
from mcp_server.server import create_mcp_server


def main() -> None:
    create_mcp_server().run("stdio")


if __name__ == "__main__":
    main()
```

- [ ] **Step 8: Run the tests**

Run: `uv run pytest -v && uv run ruff check && uv run ruff format --check && uv run pyright`
Expected: all pass.

- [ ] **Step 9: Check the server starts over stdio**

Run: `printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' | uv run amazonia360-mcp`
Expected: one JSON line whose `result.serverInfo.name` is `amazonia360`, then the process exits
when stdin closes. If the SDK rejects the protocol version, use the one the error message names.

- [ ] **Step 10: Write `mcp/README.md`**

````markdown
# Amazonia 360 MCP server

Answers questions about the physical and natural environment of the Ecuador module over an
area of interest. Design: `docs/superpowers/specs/2026-09-24-mcp-module-design.md`.

## Run

```bash
cd mcp
uv sync
uv run amazonia360-mcp        # stdio
```

### From Claude Code

```bash
claude mcp add amazonia360 -- uv --directory "$(pwd)" run amazonia360-mcp
```

### From Claude Desktop

In `claude_desktop_config.json`, with the absolute path to this directory:

```json
{
  "mcpServers": {
    "amazonia360": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/mcp", "run", "amazonia360-mcp"]
    }
  }
}
```

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `MCP_CALL_LOG` | `var/calls.jsonl` | One JSON line per tool call, with timing |
| `ARCGIS_TIMEOUT_S` | `60` | Per-request timeout against ArcGIS |

## Test

```bash
uv run pytest            # unit tests, no network
uv run pytest -m live    # against the published services
```
````

- [ ] **Step 11: Commit**

```bash
git add mcp/src mcp/tests mcp/README.md mcp/pyproject.toml
git commit -m "feat(mcp): expose the catalogue and area handlers as MCP tools over stdio"
```

---

### Task 9: Live smoke suite and CI

**Files:**
- Create: `mcp/tests/live/__init__.py` (empty), `mcp/tests/live/test_live_services.py`,
  `.github/workflows/mcp-tests.yml`

**Interfaces:**
- Consumes: `create_mcp_server`, `AreaHandlers`, `ArcGISClient`, `list_indicators`.

- [ ] **Step 1: Write `mcp/tests/live/test_live_services.py`**

```python
import httpx
import pytest

from mcp_server.arcgis.client import ArcGISClient
from mcp_server.catalogue import list_indicators
from mcp_server.catalogue.models import IndicatorMetadata
from mcp_server.handlers.area import AreaHandlers
from tests.test_handlers import TENA

pytestmark = [pytest.mark.live, pytest.mark.anyio]

AVAILABLE = [i for i in list_indicators() if i.available]


@pytest.fixture
def handlers() -> AreaHandlers:
    return AreaHandlers(ArcGISClient(httpx.AsyncClient(timeout=120)))


@pytest.mark.parametrize("indicator", AVAILABLE, ids=lambda i: str(i.id))
async def test_every_available_layer_answers_its_cheap_question(
    handlers: AreaHandlers, indicator: IndicatorMetadata
) -> None:
    if indicator.allows("presence"):
        result = await handlers.categories_in_area(indicator.id, TENA)
    else:
        result = await handlers.count_in_area(indicator.id, TENA)
    assert result.timing.arcgis_ms > 0


async def test_ecosystems_area_is_clipped(handlers: AreaHandlers) -> None:
    result = await handlers.area_by_category(210, TENA)
    assert isinstance(result.value, dict)
    assert sum(result.value.values()) <= result.aoi_ha * 1.001
```

The last assertion is the live form of the ×40 guard: the clipped total can never exceed the area
asked about.

- [ ] **Step 2: Run the live suite once**

Run: `uv run pytest -m live -v`
Expected: all pass, with `test_ecosystems_area_is_clipped` taking several seconds. A layer that
fails here is a finding to report, not a test to relax: note its id and the error.

- [ ] **Step 3: Write `.github/workflows/mcp-tests.yml`**

```yaml
name: MCP unit tests
on:
  push:
    paths:
      - "mcp/**"
      - ".github/workflows/mcp-tests.yml"
  pull_request:
    paths:
      - "mcp/**"

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mcp
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: "3.12"
      - run: uv sync --frozen
      - run: uv run ruff check
      - run: uv run ruff format --check
      - run: uv run pyright
      - run: uv run pytest
```

The live suite is excluded by the `-m 'not live'` default in `pyproject.toml`, so CI never calls
ArcGIS.

- [ ] **Step 4: Commit**

```bash
git add mcp/tests/live .github/workflows/mcp-tests.yml
git commit -m "test(mcp): add a live smoke suite and run the unit tests in CI"
```
