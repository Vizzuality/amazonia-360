# Two-layer compare map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `compare_on_map` tool that draws two module layers over one area with a draggable divider, and a size budget that keeps every map tool's result under Claude Desktop's 1 MB.

**Architecture:** A new module `maps/encoding.py` simplifies and encodes shapes as grid-snapped delta integers and fits layers to a byte budget. `map_area_by_category` adopts it; `compare_on_map` runs two `area_by_category_map` calls and hands both encoded layers to a new page, `compare.html`, which stacks two MapLibre maps and clips the top one at the divider.

**Tech Stack:** Python 3.12, shapely ≥ 2.1, the MCP Python SDK (`MCPServer`, `CallToolResult`), MapLibre GL JS 6.11.2 from jsDelivr, MCP Apps bridge (`@modelcontextprotocol/ext-apps` 2.0.0).

**Spec:** `mcp/docs/superpowers/specs/2026-10-28-map-compare-design.md`

## Global Constraints

- The whole serialised tool result (`CallToolResult.model_dump_json(by_alias=True)`) of any map tool stays under `BUDGET_BYTES = 950_000`.
- Grid: `GRID_STEPS = 8192` over the area's bounding box; first tolerance `1/2800` of the area's larger side, doubling up to `1/350`.
- No new dependency, Python or JS. No `maplibre-gl-compare`.
- Only module polygon layers (indicators whose tools include `area_by_category`).
- Figures of the two layers are never combined: no overlap or intersection figure anywhere.
- Page CSP stays `resourceDomains`/`connectDomains` = jsDelivr and OpenFreeMap.
- Page texts in English and Spanish through `map360.translator`, as the other pages.
- Run from `mcp/`: `uv run pytest`, `uv run ruff check src tests`, `uv run ruff format --check src tests`, `uv run pyright`.

## Review Focus

1. A layer whose features include `MultiPolygon` geometries and holes: encoding must keep every polygon and ring (Task 1 test `test_multipolygons_and_holes_survive`).
2. A layer that becomes empty after simplifying (every patch below the tolerance): the side is drawn empty, not an error (Task 1 test `test_tiny_patches_never_vanish`: `preserve_topology=True` keeps them; assert every input feature is still present).
3. A place whose outline is a `MultiPolygon` (a canton with islands): the grid comes from the bounding box of all its parts (Task 1 test `test_grid_covers_every_part`).
4. Two indicators where one has `empty_result` (`not_mapped_here`): `compare_on_map` returns both results and an empty side (Task 3 test `test_a_side_without_shapes_is_drawn_empty`).
5. The same indicator on both sides: refused before any query (Task 3 test `test_the_same_indicator_twice_is_refused`).

---

### Task 1: Encoding and budget

**Files:**
- Create: `src/mcp_server/maps/encoding.py`
- Test: `tests/test_map_encoding.py`

**Interfaces:**
- Produces:
  - `BUDGET_BYTES = 950_000`, `GRID_STEPS = 8192`, `FIRST_TOLERANCE = 1 / 2800`, `LAST_TOLERANCE = 1 / 350`
  - `@dataclass(frozen=True) class Grid: x0: float; y0: float; step: float` with `def to_json(self) -> dict[str, float]`
  - `def grid_for(area: dict[str, Any]) -> Grid` — origin at the area's min x/y, `step = larger side / GRID_STEPS`.
  - `def encode(collection: dict[str, Any], grid: Grid, tolerance: float) -> list[dict[str, Any]]` — `tolerance` in degrees. Each item `{"c": category, "p": [[ring, ...], ...]}`, one list per polygon, each ring a flat list `[dx0, dy0, dx1, dy1, ...]` of integer grid steps, the first pair relative to the grid origin, each next pair relative to the previous point.
  - `@dataclass(frozen=True) class FittedShapes: shapes: list[dict[str, Any]] | None; omitted_bytes: int | None; simplified: bool`
  - `def fit(collections: list[dict[str, Any]], grid: Grid, side: float, room: int) -> list[FittedShapes]` — one entry per collection, same order. `side` is the area's larger side in degrees.

- [ ] **Step 1: Write the failing tests** in `tests/test_map_encoding.py`, with a Python `decode(shapes, grid) -> dict` helper in the test file that mirrors the page's decoder (Task 2) and returns a GeoJSON `FeatureCollection`.

```python
def test_encoding_round_trips_within_half_a_step(): ...
    # 200 random squares of 0.001-0.01 deg; decode(encode(c, g, 0)) vertices within g.step / 2 of the input
def test_multipolygons_and_holes_survive(): ...
    # a MultiPolygon of 2 parts, one with a hole: decoded has 2 polygons, ring counts [2, 1]
def test_tiny_patches_never_vanish(): ...
    # 500 squares of 0.0005 deg, tolerance side / 350: every feature still present after decode
def test_grid_covers_every_part(): ...
    # grid_for(MultiPolygon with parts at x=-78 and x=-76): x0 == -78, x0 + step * GRID_STEPS >= -76's max
def test_a_layer_that_fits_is_not_simplified(): ...
    # fit([small], g, side, room=10**6)[0].simplified is False and .shapes is not None
def test_a_layer_over_its_room_is_simplified_until_it_fits(): ...
    # room just under the size at FIRST_TOLERANCE: simplified is True, len(json.dumps(shapes, separators=(",", ":"))) <= room
def test_the_larger_layer_is_reduced_first(): ...
    # big + small, room fits big at 2x tolerance plus small at first: small.simplified is False, big.simplified is True
def test_a_layer_that_cannot_fit_is_omitted(): ...
    # room=100: shapes None, omitted_bytes == len(pydantic_core.to_json(collection)), simplified False
```

- [ ] **Step 2: Run** `uv run pytest tests/test_map_encoding.py -q`. Expected: FAIL, `ModuleNotFoundError: mcp_server.maps.encoding`.

- [ ] **Step 3: Implement `encoding.py`.** Simplify with `shapely.simplify(geom, tolerance, preserve_topology=True)` (tolerance 0 skips it); sizes are `len(json.dumps(shapes, separators=(",", ":")))`. `fit`: encode every layer at `side * FIRST_TOLERANCE`; while the total exceeds `room`, take the largest layer still drawn: if its tolerance is below `side * LAST_TOLERANCE`, double it and re-encode; otherwise omit it. `simplified` is true when a layer's final tolerance is above the first.

- [ ] **Step 4: Run** `uv run pytest tests/test_map_encoding.py -q`. Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/mcp_server/maps/encoding.py tests/test_map_encoding.py
git commit -m "feat(mcp): encode map shapes on a grid and fit them to a byte budget"
```

### Task 2: `map_area_by_category` under the budget

**Files:**
- Modify: `src/mcp_server/maps/__init__.py` (`map_area_by_category`, remove `MAX_SHAPES_BYTES`), `src/mcp_server/maps/common.js`, `src/mcp_server/maps/categories.html`
- Test: `tests/test_maps.py`

**Interfaces:**
- Consumes: Task 1's `grid_for`, `fit`, `BUDGET_BYTES`, `FittedShapes`, `Grid.to_json`.
- Produces:
  - `def shapes_room(result: CallToolResult) -> int` in `maps/__init__.py`: `BUDGET_BYTES` minus the serialised size of the result built with every key of `_meta` but the shapes.
  - `_meta["map"]` of `map_area_by_category`: `area`, `styles`, `grid`, `simplified`, and `shapes` (encoded) or `shapes_omitted_bytes`.
  - `map360.decodeShapes(shapes, grid)` in `common.js`, returning a GeoJSON `FeatureCollection` whose features have `properties.category`.

- [ ] **Step 1: Write the failing tests** in `tests/test_maps.py`:

```python
async def test_the_map_result_stays_under_the_budget(tmp_path, monkeypatch): ...
    # FakeClient serving many small polygons (reuse/extend the fake in tests.test_handlers),
    # monkeypatch maps.BUDGET_BYTES low enough to force simplification;
    # len(result.model_dump_json(by_alias=True)) <= maps.BUDGET_BYTES and meta["map"]["simplified"] is True
async def test_the_map_sends_encoded_shapes_and_their_grid(tmp_path): ...
    # meta["map"]["grid"] has x0, y0, step; meta["map"]["shapes"][0] has "c" and "p"
```
  and change `test_shapes_are_left_out_when_they_and_the_area_pass_the_budget` to monkeypatch `BUDGET_BYTES` (set so that nothing fits) instead of `MAX_SHAPES_BYTES`; it keeps asserting `shapes_omitted_bytes` and the styles.

- [ ] **Step 2: Run** `uv run pytest tests/test_maps.py -q`. Expected: the new tests and the changed one FAIL.

- [ ] **Step 3: Implement.** In `map_area_by_category`, build the result without shapes, take `shapes_room`, call `fit([drawn.shapes], grid_for(drawn.area), side, room)`. In `common.js` add `decodeShapes`; in `categories.html` decode `_meta.map.shapes` with `_meta.map.grid` before `setData`, and add the note `simplified` ("Shapes simplified to fit; the figures above are exact." / "Polígonos simplificados para caber; las cifras de arriba son exactas.") when `_meta.map.simplified`.

- [ ] **Step 4: Run** `uv run pytest -q` and the lint/type commands. Expected: all pass.

- [ ] **Step 5: Check against the live layer.** Start the server as Claude Desktop does and call `map_area_by_category` with `{"indicator_id": 203, "place_id": "canton:Sucumbios/Lago Agrio"}` (a script like the one used in the design's measurement). Expected: serialised result under 950,000 bytes, `shapes` present. Then open `categories.html` (built with `maps.page("categories")`) in a browser, call `window.view.input({})` and `window.view.result(<that result as the host passes it>)`, and check the shapes draw over Lago Agrio with the legend.

- [ ] **Step 6: Commit**

```bash
git add src/mcp_server/maps tests/test_maps.py
git commit -m "fix(mcp): map results fit Claude Desktop's 1 MB with encoded shapes"
```

### Task 3: `compare_on_map` tool

**Files:**
- Modify: `src/mcp_server/maps/__init__.py`, `src/mcp_server/chat/app.py` (`MAP_TOOLS`), `README.md` (tools table and Maps section), `skills/amazonia360/SKILL.md` (Maps section)
- Create: `src/mcp_server/maps/compare.html` (a placeholder page: the Task 2 page structure with no map logic, so the resource and CSP tests pass; Task 4 fills it)
- Test: `tests/test_maps.py`, `tests/test_tools.py`

**Interfaces:**
- Consumes: Task 2's `shapes_room`, Task 1's `fit`, `grid_for`; `AreaHandlers.area_by_category_map`.
- Produces:
  - `COMPARE_URI = "ui://amazonia360/maps/compare.html"`
  - `class CompareResult(BaseModel): left: Result; right: Result`
  - Tool `compare_on_map(left_indicator_id: IndicatorId, right_indicator_id: IndicatorId, ctx: Context, area: Area = None, place_id: PlaceId = None) -> Annotated[CallToolResult, CompareResult]`
  - `_meta["map"] = {"area", "grid", "left": {"name", "styles", "simplified", "shapes" | "shapes_omitted_bytes"}, "right": {...}}`; `name` is the indicator's name as `list_indicators` gives it.

- [ ] **Step 1: Write the failing tests** in `tests/test_maps.py` (add `"compare_on_map": COMPARE_URI` to `VIEWS` only where the view tests iterate; the per-tool answer tests stay single-layer):

```python
async def test_compare_answers_what_two_area_by_category_calls_answer(tmp_path): ...
    # structured_content["left"] == area_by_category(210, TENA) and ["right"] == area_by_category(<second polygon indicator in the fixed catalogue>, TENA)
async def test_compare_sends_both_layers_with_one_area_and_grid(tmp_path): ...
    # meta["map"] keys {"area", "grid", "left", "right"}; each side has "name", "styles", "simplified" and "shapes" or "shapes_omitted_bytes"
async def test_compare_stays_under_the_budget(tmp_path, monkeypatch): ...
    # as Task 2's budget test, with two layers
async def test_the_same_indicator_twice_is_refused(tmp_path): ...
    # is_error True, text contains "two different indicators"; FakeClient received no query
async def test_an_indicator_without_area_by_category_is_refused(tmp_path): ...
    # a raster indicator (129) on one side: is_error True
async def test_a_side_without_shapes_is_drawn_empty(tmp_path): ...
    # one side's layer returns no features in the area: not an error, that side's shapes decode to 0 features
```
  and add `"compare_on_map"` to the expected set in `tests/test_tools.py`.

- [ ] **Step 2: Run** `uv run pytest tests/test_maps.py tests/test_tools.py tests/test_readme.py tests/test_skill.py -q`. Expected: FAIL (tool missing; README and skill tests fail once the tool exists, until Step 3 documents it).

- [ ] **Step 3: Implement.** Refuse equal ids with a `ToolError` reading "Choose two different indicators to compare." before any call. Run both sides with `asyncio.gather` through `logged_call` (tool name `compare_on_map`, one log line per side). Docstring, verbatim in substance: use it when the user asks to compare two layers on a map; it returns each layer's figures as `area_by_category` does; give them apart and never add, subtract or intersect them; the user sees the map and you do not, so never describe it. Register with `meta={"ui": {"resourceUri": COMPARE_URI}}` and the compare resource with the same CSP. Add the tool to `MAP_TOOLS`, to the README tools table (`| compare_on_map | Two layers' figures, with a swipe map for the user | maps/__init__.py |`) and Maps section, and to the skill's Maps section (when the user asks to compare two layers on a map; figures given apart).

- [ ] **Step 4: Run** `uv run pytest -q` and the lint/type commands. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/mcp_server/maps src/mcp_server/chat/app.py README.md skills/amazonia360/SKILL.md tests/test_maps.py tests/test_tools.py
git commit -m "feat(mcp): compare_on_map returns two layers' figures and their shapes"
```

### Task 4: The compare page

**Files:**
- Modify: `src/mcp_server/maps/compare.html`, `src/mcp_server/maps/common.js` (only if a helper is shared with `categories.html`)
- Test: `tests/test_maps.py` (the existing view tests cover the page's completeness and CSP)

**Interfaces:**
- Consumes: Task 3's `_meta["map"]` and `CompareResult`; Task 2's `map360.decodeShapes`.

- [ ] **Step 1: Build the page** following `categories.html` (same theme, legend, fonts, fullscreen, bridge, `drawOnce`):
  - Two map containers stacked in one box; the right one on top, clipped with `clip-path: inset(0 0 0 X%)`; `move` on either map jumps the other to the same camera (guard against loops).
  - A vertical divider with a handle, `role="slider"`, `aria-valuenow` in percent, dragged with pointer events and moved with the arrow keys (5% per press), starting at 50%.
  - Each side's layer name at the top of its half; two legends under the map, left then right, each like `categories.html`'s, classes clickable to hide them on that side's map.
  - Click: query the map on the side of the divider where the click lands; the popup shows the class, its hectares and the layer's name.
  - Notes per side: `simplified`, `shapes_omitted_bytes`, `not_mapped_here`, `outside_ha`, caveats, as `categories.html` words them.
  - The area outline on both maps.

- [ ] **Step 2: Check in a browser.** Capture a live `compare_on_map` result for `{"left_indicator_id": 203, "right_indicator_id": 208, "place_id": "canton:Sucumbios/Lago Agrio"}`; write `maps.page("compare")` to a file, open it, call `window.view.input({place_id: ...})` and `window.view.result(<the result>)`. Expected: both layers draw, dragging the divider reveals one over the other, the arrow keys move it, a click on each side shows that side's class, light and dark themes both legible. Repeat with the province of Sucumbíos and record whether 203 was simplified or omitted.

- [ ] **Step 3: Run** `uv run pytest -q`. Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/mcp_server/maps
git commit -m "feat(mcp): swipe page for compare_on_map"
```
