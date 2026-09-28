# MCP map spike, 28 September 2026

Open question 9 of the [spec](../specs/2026-09-24-mcp-module-design.md): can the MCP return a map
that a client shows next to the answer, drawing the area and the classes a figure was computed
over? Tried in Claude Desktop through the MCP Apps extension, which serves a page as a `ui://`
resource that the host renders in a sandboxed frame.

Status: spike finished. Decided afterwards: the maps go to staging with the rest of the MCP,
which does not go to production, with no flag of their own. The staging version replaced the
spike's code the same day; see "From spike to staging" at the end.

## Conclusions

- **A map works in Claude Desktop, with MapLibre.** The area, and the clipped classes of
  `area_by_category` with a legend of hectares, drew in 2.9 to 4.2 s from the moment the frame
  opened. OpenStreetMap raster tiles, no API key, nothing from ArcGIS in the page.
- **The ArcGIS Maps SDK does not.** It loaded and created the view, then stopped with an opaque
  `Script error.` and drew nothing. Not diagnosed; that would take Desktop's developer tools.
- **Claude's sandbox is looser than the extension's example policy.** It allows `blob:` workers
  and `'unsafe-eval'`, which MapLibre 6 needs. Under the example policy, tried locally first,
  MapLibre fails and ArcGIS draws. What counts is the host's policy, and it can change.
- **The Python SDK needs nothing added.** `mcp` 2.2 passes `_meta` on tools and on resources,
  including the resource read, which is all the extension asks of a server.
- **The page shows what the model leaves out.** The legend carried the unclassified hectares and
  the module boundary note on both maps. The model's text below them dropped the boundary note
  both times and guessed at the unclassified land once. This is the lever the spec recommends,
  figures and warnings that bypass the model's text, and it works in Desktop.

## Setup

- Three tools, in `mcp/src/mcp_server/spike_maps/` (removed since; see the last section):
  - `show_area_map_maplibre` and `show_area_map_arcgis` draw the area only.
  - `show_area_by_category_map` returns the same result as `area_by_category`, and its page draws
    the classes.
- Two tools only the page can call (`visibility: ["app"]`):
  - `category_shapes` returns the polygons clipped to the area, with the repair and intersection
    `area_by_category` uses for its hectares.
  - `report_map_diagnostics` records what loaded to `mcp/var/map-diagnostics.jsonl`.
- Each page records, before any library loads: the sandbox policy (from the first CSP violation,
  forced with an undeclared image), what was blocked, whether a `blob:` worker runs, and the time
  of each step.
- Libraries from jsDelivr: MapLibre GL JS 6.11.2, the ArcGIS Maps SDK 4.34 from `js.arcgis.com`,
  and `@modelcontextprotocol/ext-apps` 2.0.0 for the page's side of the protocol.
- Areas: the Puyo and Nuevo Rocafuerte boxes of `mcp/examples/areas.geojson`.

## The sandbox

The policy the page reported inside Claude Desktop (host `Claude 1.0.0`), against the example
policy in the extension's specification:

| Directive | Claude Desktop | Specification example |
|---|---|---|
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' blob: data:` + declared + `assets.claude.ai` | `'self' 'unsafe-inline'` + declared |
| `worker-src` | `'self' blob:` + declared + `assets.claude.ai` | not set, so `script-src` applies |
| `connect-src` | `'self' blob: data:` + declared | `'self'` + declared |
| `img-src` | `'self' data: blob:` + declared + `assets.claude.ai` | `'self' data:` + declared |

The frame's origin is a hashed subdomain of `claudemcpcontent.com`, a different one per
conversation. An API key restricted by referrer, the usual way to publish an ArcGIS key, would
have to allow the whole domain. WebGL2 was available.

## Libraries

| | Specification policy, local browser | Claude Desktop |
|---|---|---|
| MapLibre 6.11.2 | Fails: its worker is built from a `blob:` URL, blocked by `worker-src` | Draws; library loaded at 0.25 s, map complete at 2.8 s |
| ArcGIS SDK 4.34 | Draws in 0.8 s; workers and two uses of `eval` blocked, and it falls back | Loads, creates the view, stops with `Script error.` |

MapLibre 6 has no mode without a worker, so it depends on a host that allows `blob:` workers.

## Classes on the map

| | Polygons | Vertices | Size | ArcGIS + clip | Map complete |
|---|---|---|---|---|---|
| 214 Flooding regime, Nuevo Rocafuerte | 506 | 3,922 | 147 KB | 1.86 + 0.07 s | 4.2 s |
| 210 Ecosystems, Puyo | 3 | 2,206 | 48 KB | 2.30 + 0.51 s | 2.9 s |

Times are from the moment the frame opened. Clipped to the area, the shapes are small: 210
receives about 76,000 vertices over Puyo, and 2,206 remain inside the box. The figures in the
legend match those of [round 3](2026-09-28-mcp-desktop-trial-round-3.md) of the Desktop trial.

**The two calls run one after the other.** Desktop opens the frame when the tool has answered, and
only then does the page ask for the shapes. The user waits for the tool, then two to three
seconds more for the map, and ArcGIS is queried twice for the same features.

## Page and model text

| | The page | The model's text |
|---|---|---|
| Hectares per class | Every class, as `area_by_category` returns them | The classified total and its share only |
| Unclassified hectares | "have no class in this layer. They are not a class of their own." | 214: correct. 210: "probably corresponds to intervened areas or areas not covered by the ecosystem map" |
| Module boundary | "still a bounding box; part of an area near its edge may fall outside the module" | Not mentioned, either time |
| Layer facts | — | The raw field name, `covers_module: false`, and "no provenance metadata" |

The guess on 210 is the one of round 3, and the dropped boundary note is the one of the round 3
retest. The page does not stop either; it puts the correct statement next to them.

In a first conversation the model did not find the tool; in a new one it found it after a tool
search. The cause was not looked into.

## The front end's look, and interaction

Added the same day (`a0f263cb`) and tried again in Desktop on 214 over Nuevo Rocafuerte:

- Montserrat embedded in the page, the front end's tokens copied from
  `client/src/styles/globals.css` with a test that fails when they drift, the legend in the
  front end's card style, and the area in its cyan.
- Class colours from the layer's ArcGIS renderer, the source the front end's legend reads. The
  renderer does not always colour by the field the MCP reports classes by: it matches by value
  (214, 203…), by label (210, 218), through a coarser field read per class (219), or not at all
  (211, whose renderer splits each relief class; the page says so and uses a palette).
- An OpenFreeMap light grey basemap, close to the front end's Esri `gray-vector` and without a
  key, in place of OpenStreetMap tiles.
- Clicking a legend row hides or shows the class, clicking a polygon shows its hectares and share
  of the area, and a full screen button appears when the host offers that mode. Desktop offers it.

In Desktop the map was complete 1.7 s after the tool input reached the page (6.1 s after the
frame opened, 4.4 s of which the host took to deliver the input). Styles cost 0.17 s on 214. The
model's text this time gave the classified share without guessing, and again left out the
boundary note the page showed.

Tried once more after `provenance` got a description in the output schema (`4a014fc3`), Desktop
restarted on that code. The first call gave up after 60.3 s with the ArcGIS Online message; the
model called again 4 s later and got the answer in 1.3 s. The timing run saw slowness come in
spells of hours, so an immediate retry that works is new; it is one case. This time the model's
text mentioned the bounding box, the first time in any round, still wrote the raw field name
`covers_module: false`, and said "provenance comes empty" without the reading the description
gives, that it is not curated yet.

Layer 210's symbols have an alpha of 2 of 255. Drawn as the renderer says, its map shows
outlines only; the front end's legend drops alpha, so the legend shows solid colours. Filed as
AM-729, and 211's class field against its renderer as AM-730.

## A raster

Tried the same day with canopy height (indicator 129 of the regional platform, an ImageServer on
`atlas.iadb.org`), over the Puyo box and a star-shaped area:

- The image server answers CORS only for the front end's own origins
  (`amazoniaforever360.org` and its staging), so the page cannot load its images. The server
  asks for one `exportImage` of the area and its surroundings and hands the PNG to the page,
  which draws it under the basemap's water, roads and names and dims it outside the area.
- The figures are shares of the area's pixels per class, from `computeHistograms` with the
  front end's classification. The rendering and legend are the front end's.
- Two traps. The front end stores its raster function in the JS SDK's form; sent as is, the
  REST service ignores it without an error and returns greyscale. And the classification has
  to be asked for as integers, or the histogram comes in 256 float bins that misread the classes.
- Fast: 0.45 s for the histogram and 0.15 to 0.46 s for the image, 3 to 9 KB.
- The layer is served at about 1 km pixels (400 over the 20 km box); its description says
  250 m. Filed as AM-731.

## From spike to staging

The spike's code is gone. The maps now live in `mcp/src/mcp_server/maps/` as two tools,
`map_area_by_category` and `map_class_shares_in_area`, the second over the five classed rasters
now in the catalogue. The ArcGIS variant, the area-only maps, the diagnostics
and the tools only the page could call were dropped. What the spike left for staging, and where
each item stands:

- **One fetch per map: done.** The tool answers with the figures and puts the clipped shapes and
  their colours in the result's `_meta`, which the host hands to the page and not to the model.
  The layer's renderer is fetched alongside the query and kept for later calls. The one extra
  query left is for layers coloured by a field other than their class (219), where each class's
  value has to be read.
- **The shapes from the handler: done.** `AreaHandlers.area_by_category_map` clips once and
  returns the same `Result` as `area_by_category` along with the map. The clipped polygons are
  now dissolved per class, so the payload is smaller: 82 KB against 147 KB for 214 over the
  same box.
- **The page's notes in the user's language: done, English and Spanish.** The page takes the
  host's locale, then the browser's. Class names and CMS caveats stay in the language the data
  is in.
- **A fallback for hosts that do not render MCP Apps: done.** The tools return what the plain
  tools return, as the same text, so such a host gets the figures without the map.
- **The basemap provider: decided, OpenFreeMap.** Its Positron style is close to the front end's
  Esri gray-vector and needs no key. Esri's own style would put an API key in the page, spend the
  account's quota on every view, and tie an open-source release to ArcGIS.
- **Retried in Desktop (2026-09-28): Desktop hands `_meta` to the page.** Over the Tena box,
  `map_area_by_category` on ecosystems (210) drew the class's shapes, and
  `map_class_shares_in_area` on land cover (13) drew the raster image with the outside dimmed.
  Neither page showed the note that the shapes or the image did not arrive. On 210 the map
  shows outlines only, because its renderer fills at alpha 2 of 255, the same as the front end.
  Whether the model also sees `_meta` was not checked.

## Not tried

- Other hosts: claude.ai on the web, ChatGPT, or the Amazonia 360 front end as a host.
- Layers that receive hundreds of thousands of vertices inside the area, such as 203.
- Interaction beyond pan and zoom: a click on a class, or asking the model about what is shown.
- Why the ArcGIS SDK fails in Desktop.
