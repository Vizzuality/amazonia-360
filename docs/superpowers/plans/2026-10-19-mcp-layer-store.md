# MCP Layer Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `area_by_category` (and its map) answers from a local, gridded copy of each vector layer or from precomputed figures per named place, chosen by a source selector, with live ArcGIS as the fallback.

**Architecture:** A new package `mcp_server.store` holds the copy on disk (one directory per layer), the place boundaries and the precomputed figures. `mcp_server.store.sources` defines `AreaSource`s and a `SourceSelector` that returns the first answer. The handler asks the selector instead of the ArcGIS client; the catalogue CLI builds and refreshes the store.

**Tech Stack:** Python 3.12+, shapely 2 (STRtree, make_valid, box), pyproj (existing geodesic area), httpx, pydantic, pytest. No new dependency.

**Spec:** `docs/superpowers/specs/2026-10-19-mcp-layer-store-design.md`

## Global Constraints

- No new dependency. Shapely, pyproj and httpx cover download, split, index and measure.
- `mcp_server.geometry.area` stays the single way hectares are measured (`clip_by_category`, `area_by_category`, `category_shapes`).
- The copy is downloaded with `maxAllowableOffset` equal to the handler's simplification, 0.001°.
- The copy loads without a network call; without a store the server answers from live ArcGIS.
- Classes present (`categories_in_area`) and feature counts (`count_in_area`) stay on live ArcGIS. Rasters are untouched.
- A copy answers only when its manifest's `layer_last_edit` equals `indicator.sync.layer_last_edit` of the loaded catalogue. Precomputed figures answer only when both the layer version and the places snapshot's `generated_at` match.
- Every `area_by_category` result says its source (`precomputed`, `local_copy`, `arcgis`) and, for the first two, the layer version.
- The copy is generated, never committed. Default location `var/layer-store`, overridable with `MCP_LAYER_STORE`.
- Code style: Black (line length 88), Ruff, type hints everywhere, minimal comments explaining why.

## Review Focus

1. A layer whose features arrive invalid (collapsed rings after simplification, as on layer 214) must build without raising and measure the same as the live path, which repairs with `make_valid(method="structure", keep_collapsed=False)`. Test in Task 2.
2. An area that crosses many grid cells must give the same hectares as the unsplit feature: no double counting along cell edges. Test in Task 2.
3. A store directory that is missing, half-written (manifest absent) or from an older layer version must make the request fall to the next source, never raise and never answer. Tests in Tasks 3 and 4.
4. A named place answered from precomputed figures must make no ArcGIS call at all, boundary included. Test in Task 5.
5. A drawn area outside every piece of a layer (a protected area the layer does not map, such as Cajas) must return empty hectares from the copy, as live does, so `layer.empty_result` stays `not_mapped_here`. Test in Task 4.

---

### Task 1: Download a whole layer from ArcGIS

**Files:**
- Modify: `mcp/src/mcp_server/arcgis/client.py` (the `features` method and its paging loop)
- Test: `mcp/tests/test_arcgis_client.py`

**Interfaces:**
- Produces: `ArcGISClient.layer_features(layer: Layer, max_allowable_offset: float) -> list[Feature]`, every feature of the layer with its class, paged, no geometry filter. `Feature` stays `tuple[str, BaseGeometry]`.

- [ ] **Step 1: Write the failing tests**

```python
async def test_layer_features_pages_without_a_geometry_filter() -> None:
    # MockTransport serves two pages (exceededTransferLimit true, then false).
    # Assert: 3 features returned in order; no request carried a "geometry" field;
    # every request carried where=1=1 and maxAllowableOffset=0.001.

async def test_layer_features_skips_null_classes_and_null_geometry() -> None:
    # One page with a null class, a null geometry and one good feature -> 1 feature.
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_arcgis_client.py -k layer_features -v`
Expected: FAIL, `AttributeError: 'ArcGISClient' object has no attribute 'layer_features'`

- [ ] **Step 3: Implement `layer_features`**

Extract the paging loop of `features` into a private `_paged_features(layer, params)` that both methods call; `features` adds the geometry filter through `_query`, `layer_features` posts `where=1=1` without one. Same `MAX_PAGES`, same repeated-page and truncation checks.

- [ ] **Step 4: Run the client tests**

Run: `cd mcp && uv run pytest tests/test_arcgis_client.py -v`
Expected: PASS, including the existing `features` tests.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/arcgis/client.py mcp/tests/test_arcgis_client.py
git commit -m "feat(mcp): the ArcGIS client downloads a whole layer, paged"
```

### Task 2: Split features along a grid

**Files:**
- Create: `mcp/src/mcp_server/store/__init__.py` (empty docstring module)
- Create: `mcp/src/mcp_server/store/split.py`
- Test: `mcp/tests/test_store_split.py`

**Interfaces:**
- Consumes: `Feature` from `mcp_server.arcgis.client`.
- Produces: `DEFAULT_CELL_DEG: float = 0.1`; `split_by_grid(features: list[Feature], cell_deg: float) -> list[Feature]`.

- [ ] **Step 1: Write the failing tests**

```python
def test_a_feature_spanning_cells_becomes_one_piece_per_cell() -> None:
    pieces = split_by_grid([("Bosque", box(0.05, 0.05, 0.35, 0.15))], 0.1)
    assert len(pieces) == 6 and {c for c, _ in pieces} == {"Bosque"}

def test_pieces_measure_the_same_as_the_feature() -> None:
    feature = ("Bosque", Polygon([(-77.93, -1.12), (-77.41, -1.07), (-77.6, -0.71)]))
    aoi = box(-77.8, -1.1, -77.5, -0.8)
    whole = clip_area_by_category(aoi, [feature])["Bosque"]
    split = clip_area_by_category(aoi, split_by_grid([feature], 0.1))["Bosque"]
    assert split == pytest.approx(whole, rel=1e-9)

def test_an_invalid_feature_is_repaired_before_splitting() -> None:
    bowtie = Polygon([(0, 0), (0.3, 0.3), (0.3, 0), (0, 0.3), (0, 0)])
    pieces = split_by_grid([("x", bowtie)], 0.1)
    assert pieces and all(g.is_valid for _, g in pieces)

def test_a_cell_corner_touch_leaves_no_empty_or_line_piece() -> None:
    pieces = split_by_grid([("x", box(0.0, 0.0, 0.1, 0.1))], 0.1)
    assert len(pieces) == 1
    assert all(g.geom_type in ("Polygon", "MultiPolygon") for _, g in pieces)
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_store_split.py -v`
Expected: FAIL, `ModuleNotFoundError: mcp_server.store`

- [ ] **Step 3: Implement `split_by_grid`**

Repair invalid geometry with `shapely.make_valid(geom, method="structure", keep_collapsed=False)` (the same repair as `clip_by_category`), then intersect with each grid cell of the feature's bounds, aligned to multiples of `cell_deg`, keeping only `polygonal_parts` and dropping empties.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd mcp && uv run pytest tests/test_store_split.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/store mcp/tests/test_store_split.py
git commit -m "feat(mcp): split a layer's features along a grid of cells"
```

### Task 3: The store on disk

**Files:**
- Create: `mcp/src/mcp_server/store/models.py`
- Create: `mcp/src/mcp_server/store/files.py`
- Test: `mcp/tests/test_store_files.py`

**Interfaces:**
- Consumes: `split_by_grid`, `Feature`.
- Produces, in `models.py` (pydantic):
  - `LayerManifest(indicator_id: int, layer_last_edit: datetime | None, simplification: float, cell_deg: float, features: int, pieces: int, built_at: datetime)`
  - `PlaceFigures(indicator_id: int, layer_last_edit: datetime | None, places_generated_at: str, hectares: dict[str, dict[str, float]])`, keyed by place id.
- Produces, in `files.py`:
  - `class LayerCopy` with `manifest: LayerManifest` and `pieces_in(aoi: BaseGeometry) -> list[Feature]` (STRtree query on bounds, then pieces whose geometry intersects).
  - `class LayerStore(root: Path)` with
    - `write_layer(manifest: LayerManifest, pieces: list[Feature]) -> None`
    - `layer(indicator_id: int) -> LayerCopy | None` (loads on first use and keeps it)
    - `manifest(indicator_id: int) -> LayerManifest | None`
    - `write_boundaries(generated_at: str, boundaries: dict[str, BaseGeometry]) -> None`
    - `boundary(place_id: str, generated_at: str) -> Polygon | MultiPolygon | None`
    - `write_figures(figures: PlaceFigures) -> None`
    - `figures(indicator_id: int) -> PlaceFigures | None`

Layout under `root`: `layers/<indicator_id>/manifest.json`, `layers/<indicator_id>/pieces.jsonl.gz` (one line per piece, `{"c": class, "g": WKB hex}`), `places/boundaries.jsonl.gz` with `places/manifest.json` holding `generated_at`, `figures/<indicator_id>.json`. A layer is written to a temporary directory and renamed into place, manifest last, so a half-written layer has no manifest.

- [ ] **Step 1: Write the failing tests**

```python
def test_a_written_layer_reads_back(tmp_path: Path) -> None:
    # write_layer with 2 pieces, then a fresh LayerStore(tmp_path).layer(208):
    # manifest equal; pieces_in(box around piece 1) returns only piece 1.

def test_a_missing_or_half_written_layer_is_none(tmp_path: Path) -> None:
    # layers/208/pieces.jsonl.gz without manifest.json -> layer(208) is None;
    # layer(999) is None; no exception.

def test_rewriting_a_layer_replaces_it_whole(tmp_path: Path) -> None:
    # write v1, write v2 with other pieces -> a fresh store reads only v2.

def test_boundaries_answer_only_for_their_snapshot(tmp_path: Path) -> None:
    # write_boundaries("2026-10-19T10:00:00Z", {...}); boundary(id, same) is the
    # geometry; boundary(id, "2026-10-20T10:00:00Z") is None.

def test_figures_read_back(tmp_path: Path) -> None: ...
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_store_files.py -v`
Expected: FAIL, import error.

- [ ] **Step 3: Implement `models.py` and `files.py`** as specified in Interfaces.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd mcp && uv run pytest tests/test_store_files.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/store mcp/tests/test_store_files.py
git commit -m "feat(mcp): a layer store on disk: gridded pieces, place boundaries, precomputed figures"
```

### Task 4: Sources and the selector

**Files:**
- Create: `mcp/src/mcp_server/store/sources.py`
- Test: `mcp/tests/test_store_sources.py`

**Interfaces:**
- Consumes: `LayerStore`, `LayerCopy`, `PlaceFigures`; `ArcGISClient.features`; `clip_by_category`, `area_by_category`, `category_shapes`, `vertex_count`; `IndicatorMetadata`, `Layer`, `Place`.
- Produces:
  - `SourceName = Literal["precomputed", "local_copy", "arcgis"]`
  - `@dataclass(frozen=True) AreaRequest(indicator: IndicatorMetadata, layer: Layer, aoi: Polygon | MultiPolygon, place_id: str | None, with_shapes: bool)`
  - `@dataclass Measurement(hectares: dict[str, float], shapes: list[dict[str, Any]], features: int, vertices_received: int, source: SourceName, layer_version: datetime | None)`
  - `class AreaSource(Protocol)`: `name: SourceName`; `async def measure(self, request: AreaRequest) -> Measurement | None` (None: this source cannot answer).
  - `ArcGISSource(client: ArcGISClient, simplification: float)`, always answers.
  - `LocalCopySource(store: LayerStore)`, answers when `store.layer(id)` exists and its manifest's `layer_last_edit == request.indicator.sync.layer_last_edit`.
  - `PrecomputedSource(store: LayerStore, places_generated_at: str)`, answers only with `place_id` set, `with_shapes` false, figures present for the place, figures' `layer_last_edit` equal to the indicator's and `places_generated_at` equal to the loaded snapshot's.
  - `class SourceSelector(sources: list[AreaSource])` with `async def measure(request) -> Measurement`; the last source must always answer, else `RuntimeError`.
  - `SOURCE_NAMES: tuple[SourceName, ...] = ("precomputed", "local_copy", "arcgis")`

Both copy-based sources run the clip with `asyncio.to_thread`, as the handler does today.

- [ ] **Step 1: Write the failing tests**

```python
async def test_selector_uses_the_first_source_that_answers() -> None: ...
async def test_selector_raises_when_no_source_answers() -> None: ...
async def test_local_copy_steps_aside_when_its_version_is_not_the_catalogue_s(
    tmp_path: Path,
) -> None:
    # manifest layer_last_edit 2026-09-01, indicator sync 2026-10-01 -> None
async def test_local_copy_matches_the_live_path_on_the_same_features(
    tmp_path: Path,
) -> None:
    # The same features through ArcGISSource (FakeClient) and through a store built
    # with split_by_grid: equal hectares (approx 1e-9) and the same class set.
async def test_local_copy_outside_every_piece_is_empty(tmp_path: Path) -> None:
    # hectares == {} and source == "local_copy"
async def test_precomputed_needs_a_place_and_no_shapes(tmp_path: Path) -> None:
    # place_id None -> None; with_shapes True -> None; matching place -> its figures
async def test_precomputed_steps_aside_on_a_new_places_snapshot(
    tmp_path: Path,
) -> None: ...
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_store_sources.py -v`
Expected: FAIL, import error.

- [ ] **Step 3: Implement `sources.py`** as specified in Interfaces. `features` in `Measurement` is the number of pieces (copy) or features (live) that reached the clip; `vertices_received` is 0 for copy and precomputed sources.

- [ ] **Step 4: Run them to verify they pass**

Run: `cd mcp && uv run pytest tests/test_store_sources.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/store/sources.py mcp/tests/test_store_sources.py
git commit -m "feat(mcp): area sources and a selector: precomputed, local copy, live ArcGIS"
```

### Task 5: The handler asks the selector

**Files:**
- Modify: `mcp/src/mcp_server/handlers/area.py` (`AreaHandlers.__init__`, `_area_by_category`, `_area`)
- Modify: `mcp/src/mcp_server/handlers/result.py` (`ComputedOver`)
- Modify: `mcp/src/mcp_server/places/geometry.py` (`PlaceGeometries`)
- Modify: `mcp/src/mcp_server/tools/area.py` (`logged_call`)
- Modify: `mcp/src/mcp_server/config.py` (`Settings`)
- Modify: `mcp/src/mcp_server/server.py` (handler construction)
- Test: `mcp/tests/test_handlers.py`, `mcp/tests/test_place_geometry.py`, `mcp/tests/test_tools.py`

**Interfaces:**
- Consumes: `SourceSelector`, `ArcGISSource`, `LocalCopySource`, `PrecomputedSource`, `LayerStore`, `SOURCE_NAMES`.
- Produces:
  - `AreaHandlers(client, simplification=0.001, places=None, selector: SourceSelector | None = None, store: LayerStore | None = None)`. No selector means `SourceSelector([ArcGISSource(client, simplification)])`, so every existing test keeps passing unchanged.
  - `ComputedOver.source: SourceName | None` and `ComputedOver.layer_version: datetime | None`, both with field descriptions for the model (source of the hectares; date of the layer version the copy was built from).
  - `PlaceGeometries(client, *, stored: Callable[[str], Polygon | MultiPolygon | None] | None = None, ...)`: a stored boundary is used before any network call.
  - `Settings.layer_store_path: Path` (env `MCP_LAYER_STORE`, default `var/layer-store`) and `Settings.area_sources: tuple[SourceName, ...]` (env `MCP_AREA_SOURCES`, comma-separated, default all of `SOURCE_NAMES`; `arcgis` is always appended last if missing).
  - The call log record of an area call gains `source` and `layer_version`.

- [ ] **Step 1: Write the failing tests**

```python
async def test_area_by_category_reports_the_live_source_by_default() -> None:
    # computed_over.source == "arcgis", layer_version is None

async def test_area_by_category_answers_from_the_local_copy(tmp_path: Path) -> None:
    # A store with a current copy of the test indicator: FakeClient.calls has no
    # "features"; source == "local_copy"; layer_version == the manifest's.

async def test_a_named_place_from_precomputed_figures_calls_no_arcgis(
    tmp_path: Path,
) -> None:
    # Stored boundary + figures for canton:Napo/Tena: FakeClient.calls == []
    # (no "boundary", no "features"); source == "precomputed".

async def test_the_map_never_comes_from_precomputed_figures(tmp_path: Path) -> None:
    # area_by_category_map with figures present -> source == "local_copy" or "arcgis"

def test_settings_read_the_store_path_and_source_order(monkeypatch) -> None:
    # MCP_AREA_SOURCES="local_copy" -> ("local_copy", "arcgis")
```

In `test_tools.py`, extend the existing logged-call test: the record carries `"source": "arcgis"`.

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_handlers.py tests/test_place_geometry.py tests/test_tools.py -v`
Expected: the new tests FAIL; the existing ones pass.

- [ ] **Step 3: Implement**

`_area_by_category` builds an `AreaRequest` and calls the selector inside the `arcgis` lap when the source is live and a `store` lap otherwise (add `store_ms` to `Timing`); `_measure` moves into the sources. `_area` passes the stored boundary through `PlaceGeometries`. `server.py` builds the store and the selector from `Settings`, with `places_generated_at` from the loaded places snapshot.

- [ ] **Step 4: Run the whole suite**

Run: `cd mcp && uv run pytest -q && uv run ruff check src tests && uv run ruff format --check src tests`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add mcp/src mcp/tests
git commit -m "feat(mcp): area_by_category asks a source selector and says which source answered"
```

### Task 6: Build and refresh the store

**Files:**
- Create: `mcp/src/mcp_server/store/build.py`
- Modify: `mcp/src/mcp_server/catalogue/cli.py`
- Test: `mcp/tests/test_store_build.py`

**Interfaces:**
- Consumes: `ArcGISClient.layer_features`, `ArcGISClient.boundary`, `split_by_grid`, `LayerStore`, `clip_area_by_category`, `check_aoi`, the catalogue and places loaders.
- Produces:
  - `stale_layers(store: LayerStore, indicators: list[IndicatorMetadata]) -> list[int]`: area-capable vector indicators whose copy is missing or whose manifest version differs from `sync.layer_last_edit`.
  - `async def build_layers(client, store, indicators, *, only: list[int] | None, cell_deg: float, simplification: float, now: datetime) -> dict[int, str]`: per indicator `"built"`, `"current"` or the error text. A failure leaves that layer's previous copy in place.
  - `async def build_places(client, store, places: Places, indicator_ids: list[int]) -> dict[int, str]`: writes the boundaries once, then the figures of each given layer.
  - CLI: `amazonia360-mcp-catalogue store [--rebuild ID ... | --rebuild-all] [--store PATH] [--cell DEG]` builds what is stale, or what is asked; `sync` calls the same step after writing the snapshots and prints one line per layer. Exit code 1 if any layer failed.

- [ ] **Step 1: Write the failing tests**

```python
def test_stale_layers_lists_missing_and_outdated_copies(tmp_path: Path) -> None: ...
async def test_build_layers_builds_stale_and_skips_current(tmp_path: Path) -> None:
    # FakeClient with layer_features; 2 indicators, one current -> built/current
async def test_a_failed_layer_keeps_its_previous_copy(tmp_path: Path) -> None:
    # layer_features raises ArcGISError -> result has the error; old manifest stays
async def test_build_places_writes_boundaries_and_figures(tmp_path: Path) -> None:
    # figures equal clip_area_by_category over the stored boundary
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd mcp && uv run pytest tests/test_store_build.py -v`
Expected: FAIL, import error.

- [ ] **Step 3: Implement `build.py` and the CLI changes.** Boundaries come from `client.boundary` per place, as `PlaceGeometries` reads them today, passed through `check_aoi(geom, max_vertices=None, reach=False)`.

- [ ] **Step 4: Run them, then build the real store**

Run: `cd mcp && uv run pytest tests/test_store_build.py -v`
Expected: PASS
Run: `cd mcp && uv run amazonia360-mcp-catalogue store --rebuild-all`
Expected: one `built` line per module vector layer and a places line; `var/layer-store/` populated. Record the build time and store size in the commit message.

- [ ] **Step 5: Commit**

```bash
git add mcp/src/mcp_server/store/build.py mcp/src/mcp_server/catalogue/cli.py mcp/tests/test_store_build.py
git commit -m "feat(mcp): build and refresh the layer store from the catalogue CLI"
```

### Task 7: Parity, cell size and the before-and-after measurement

**Files:**
- Create: `mcp/tests/live/test_layer_store_parity.py`
- Modify: `mcp/src/mcp_server/measurement/timing_run.py` (a `--sources` option passed to the handler's selector)
- Create: `docs/superpowers/evaluations/2026-10-XX-mcp-layer-store-measurement.md` (date of the run)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the live parity test** (`@pytest.mark.live`): for every module vector indicator and the places Tena, the five cantons of Napo, Yasuní, Pastaza and the 40 protected areas, `LocalCopySource` and `ArcGISSource` give the same set of classes, and per class `abs(copy - live) <= max(1.0, 0.005 * live)` hectares.

- [ ] **Step 2: Run it**

Run: `cd mcp && uv run pytest -m live tests/live/test_layer_store_parity.py -v`
Expected: PASS. If a class misses the tolerance, record the observed difference and tighten or relax the tolerance in the test with a comment saying why.

- [ ] **Step 3: Choose the cell size.** Build the store with `--cell` 0.05, 0.1 and 0.25 on layers 208 and 210, time `area_by_category` on Tena and Yasuní for each, and set `DEFAULT_CELL_DEG` to the fastest; record the table in the evaluation.

- [ ] **Step 4: Measure before and after.** Run the timing run once with `--sources arcgis` and once with the default order, over the existing areas, and write the medians per layer to the evaluation, together with question 19 rerun in Claude Desktop (total time, number of areas checked).

- [ ] **Step 5: Commit**

```bash
git add mcp/tests/live mcp/src/mcp_server/measurement docs/superpowers/evaluations
git commit -m "test(mcp): layer store parity against live ArcGIS, and the before-and-after measurement"
```

### Task 8: Documentation

**Files:**
- Modify: `mcp/README.md` (a "Layer store" section: what it is, `amazonia360-mcp-catalogue store`, `MCP_LAYER_STORE`, `MCP_AREA_SOURCES`, that the image build runs `store` and that a new layer version reaches staging with the next deployment)
- Modify: `mcp/ROADMAP.md` (the cache item moves from "To decide" to "Done"; the PostGIS store and the update pipeline go under "Next", pointing at the spec's "After the proof of concept")
- Modify: `mcp/docs/how-it-works.md` (the store in the system table and the tool table's typical times). This file is untracked on purpose: edit it, do not commit it.

- [ ] **Step 1: Update the three files**, with the measured figures from Task 7.

- [ ] **Step 2: Check**

Run: `cd mcp && uv run pytest -q`
Expected: PASS (the skill and docs tests included).

- [ ] **Step 3: Commit**

```bash
git add mcp/README.md mcp/ROADMAP.md
git commit -m "docs(mcp): the layer store, how to build it and what it changed"
```
