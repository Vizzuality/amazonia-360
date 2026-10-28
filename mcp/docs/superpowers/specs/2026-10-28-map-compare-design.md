# Two-layer compare map in the Amazonia 360 MCP — Design

Status: approved in conversation on 28 October 2026, written for planning.

## 1. Intent

The MCP already draws one layer over an area (`map_area_by_category`). The owner wants the
common swipe map: two layers over the same place, and a vertical bar the user drags so one
layer covers the other. It is for the IDB demo in Claude Desktop, where the question is
"is forest being lost where restoration is the priority?": the restoration priority areas
(2016) against deforestation 2020-2022 in the canton Lago Agrio.

The server's rule is that figures from two indicators are never combined: they come from
different sources and years. The swipe map respects it. Claude gives each layer's
figures apart, and the people looking at the map see where the two coincide.

## 2. Goals

- A new tool, `compare_on_map`, that takes two indicators and one area (a `place_id` or a
  GeoJSON polygon) and returns each layer's figures, as `area_by_category` would, plus a
  map with a draggable divider: the left layer on one side, the right layer on the other.
- Each side has its legend with hectares by class, and clicking a shape shows its class,
  as on the current map.
- The whole tool result stays under Claude Desktop's 1 MB limit, by simplifying shapes
  until they fit.
- The same budget fixes `map_area_by_category`, whose result passes 1 MB today: the
  restoration priority map of Lago Agrio is 2.25 MB, deforestation over the province of
  Sucumbíos 1.17 MB.

## 3. Non-goals

- Raster layers (land cover, forest cover, canopy height, slope, grassland). Only the
  module's polygon layers, the ones `area_by_category` answers, in this version.
- More than two layers, or a time slider.
- The chat front end. It draws its own maps and excludes the map tools; the new tool is
  excluded the same way.

## 4. Anti-goals

- Claude adding, subtracting or intersecting the two layers' figures (for example "x ha
  of the priority area was deforested"). The tool returns no overlap figure.
- A result over 1 MB. Claude Desktop rejects it, and the demo stops on an error.
- Shapes dropped silently. If a layer still does not fit after simplifying, the page
  says so, as the current map does.

## 5. Constraints

- 1 MB for the whole tool result in Claude Desktop: text content, structured content and
  `_meta` together.
- MapLibre GL JS 6.11.2 from jsdelivr and the OpenFreeMap basemap, as now; the page's CSP
  allows only those two domains.
- No new dependency. The `maplibre-gl-compare` plugin is not on the Tech Radar; the divider
  is built with MapLibre alone.
- The owner chose polygons over images: shapes stay vectors, so click and zoom keep working,
  at the cost of some detail once simplified.

## 6. Decisions made by the owner

- The use case: restoration priority against deforestation 2020-2022, in Lago Agrio.
- Two layers, a slider that hides one and shows the other: the standard swipe map.
- Simplified polygons, not server-drawn images.

## 7. Architecture

### 7.1 Tool

`compare_on_map(left_indicator_id, right_indicator_id, area=None, place_id=None)`.

- Both indicators must be answerable through `area_by_category`, and they must differ;
  otherwise the tool fails as a whole with the error the other tools give for a bad
  indicator. A layer with no shapes in the area (`empty_result`, such as
  `not_mapped_here`) is not a failure: its side is drawn empty and its result says why.
  Any other error on one side fails the tool. *(Builder check; my call.)*
- The two measurements run concurrently through `AreaHandlers.area_by_category_map`.
- The structured result holds both results, `{"left": Result, "right": Result}`, each the
  same as `area_by_category` returns, so a host without maps still gets the figures,
  each with its own `coverage`.
- `_meta` is `{"map": {"area": <outline>, "grid": {...}, "left": {"styles", "shapes" or
  "shapes_omitted_bytes", "simplified", "name"}, "right": {...}}}`. One outline for both
  sides: the area is the same place or polygon, and the left result's outline is drawn.
  *(Builder check; my call.)*
- The tool's docstring says: use it when the user asks to compare two layers on a map;
  give each layer's figures apart and never combine them; the user sees the map and the
  model does not.
- Registered next to the map tools, with its own UI resource
  `ui://amazonia360/maps/compare.html`, added to the chat app's `MAP_TOOLS` exclusion, and
  covered in the `amazonia360` skill.

### 7.2 Size budget and encoding

Simplifying alone does not get there. Measured on 28 October 2026 over Lago Agrio (layer
203, 2,444 KB as GeoJSON; layer 208, 426 KB): shapely `simplify` stops shrinking a layer
of many small patches long before it fits (203 levels off at about 465 KB) and deletes
the small patches on the way (208 kept 69% of its area at a tolerance of 1/700 of the
area's width). Encoding the coordinates as integers does the work instead:

| Lago Agrio | GeoJSON | Simplified to 1/2800 of the width, then encoded on an 8,192 grid |
|---|---|---|
| 203 Restoration priority | 2,444 KB | 317 KB |
| 208 Deforestation | 426 KB | 93 KB (99.9% of the area kept at that tolerance) |
| 208 over the province of Sucumbíos | 1,279 KB | 202 KB |

So, one function, used by both map tools:

- **Encoding.** Each layer's shapes go to the page as a compact form: per feature its
  category and its polygons; per ring the coordinates snapped to a grid of 8,192 steps
  over the area's bounding box (about 13 m on Lago Agrio) and written as differences
  from the previous point. `_meta` carries the grid's origin and step. The page decodes
  it back to GeoJSON in a few lines of its own; no library.
- **Simplifying.** Before encoding, `shapely.simplify` with `preserve_topology=True` at
  1/2800 of the area's larger side, a quarter of a pixel on a map 700 px wide. Only if the
  result is still over budget, the tolerance doubles, up to 1/350.
- **Budget.** 950,000 bytes for the whole serialised tool result (text content,
  structured content and `_meta`, as `CallToolResult.model_dump_json` writes it), leaving
  room for the protocol's framing. It replaces `MAX_SHAPES_BYTES` (4 MB). The shapes'
  share is what remains after the rest; with two layers, the larger layer is reduced
  first, so a small layer is not simplified to make room for a big one.
- **Omitted.** A layer still over its share at 1/350 is left out with
  `shapes_omitted_bytes`, as now; the page says so and the figures stay complete.
- **Simplified.** `_meta` says per layer whether the tolerance went past 1/2800, and the
  page then says "simplified to fit" under that layer's legend.
- `map_area_by_category` keeps its current `_meta` keys (`area`, `styles`, `shapes` or
  `shapes_omitted_bytes`) with `shapes` in the new encoding plus `grid` and
  `simplified`; `categories.html` decodes it. The existing tests move to the new form.

The province of Sucumbíos with layer 203 is 5.9 MB as GeoJSON and was not measured
encoded; it is the case most likely to need more than 1/2800 or to be omitted.

### 7.3 Page

A third page beside `categories.html` and `raster.html`, sharing `common.js`, `theme.css`,
`legend.css` and the bridge.

- Two MapLibre maps in the same container, the right one on top, clipped with CSS
  `clip-path` at the divider's position; moving one map moves the other.
- A vertical divider with a handle, dragged with mouse, touch and keyboard (arrow keys),
  starting in the middle.
- Each side labelled at the top with its layer's name; each layer's legend below the map
  with hectares by class, and on both legends a class can be clicked to hide it, as on
  the current map.
- Clicking a shape shows its class and its layer's name. The click goes to the side of
  the divider it lands on: left of the divider, the left map is queried, even though the
  right map's container sits on top. *(Builder check; my call.)*
- The area's outline drawn on both maps.

## 8. Left to the builder

- The exact encoded form (array layout, key names), within section 7.2.
- Whether the two maps share one style object.
- The same indicator on both sides is refused (section 7.1); the error's wording.
- How the page reports a simplified or omitted layer, in the words the current map uses.

## 9. Checks

- Unit tests for the budget function: a layer over its share is simplified and fits; a
  layer that cannot fit is omitted; the larger of two layers is reduced first; the whole
  serialised result stays under 950,000 bytes.
- The encoding round-trips: decoded coordinates fall within half a grid step of the
  simplified ones (a Python decoder in the test, mirroring the page's).
- `map_area_by_category` over Lago Agrio with layer 203 comes in under 1 MB, with shapes.
- `compare_on_map` with 203 and 208 over Lago Agrio and over the province of Sucumbíos:
  both results present, both layers drawn, under 1 MB.
- Rehearsed in Claude Desktop with the demo question.

## 10. Risks

- At province scale, small deforestation patches may vanish when simplified. The demo
  uses a canton; the page says when a layer was simplified.
- The 1 MB limit is the owner's observation of Claude Desktop, not a published figure. If
  another host has a lower limit, the budget is one constant.
