# MCP layer store: answering area questions without downloading the layer each time

A local, processed copy of the vector layers, and a single place where each area tool picks the
fastest source that can answer. Built for the Ecuador module as part of Deliverable 6, and
designed to carry over to the whole Amazon after the proof of concept.

Proposed on 19 October 2026. Context in the D6 question requirements
(`discovery/deliverables/ai-poc-question-requirements.md`, section "Repeated queries, and how
they scale").

## Why

Ten of the 13 vector layers of the Ecuador module are published with one feature per class,
each spread across the whole module. ArcGIS returns every feature that touches the area, whole,
and the server clips it. So every area query downloads about 300,000 vertices whatever the size
of the area: 5 to 20 s per query, and a question over 40 protected areas took 3 min 15 s for half
of them on 19 October.

After the proof of concept the platform covers the whole Amazon, more than 50 times the area of
the module. The layers will keep arriving the same way: prepared by consultants, published on
ArcGIS Online, with no say from this project in how they are split. Users ask over areas they
draw, which is most of what the current front end does, and over named places.

The server has to adapt to the data as published, not the other way round.

## Goals

1. An area query on a vector layer reads only the part of the layer near the area, for drawn
   areas and named places alike.
2. Each area tool asks for what it needs ("hectares per class of this layer in this area") and
   does not know where the answer comes from. A new strategy, or a new layer, does not touch the
   tools.
3. Two strategies built now: a local copy of each layer, split into small pieces, and precomputed
   hectares for named places. Live ArcGIS stays as the fallback.
4. The copy is rebuilt on demand, after a layer is uploaded, by the existing catalogue sync, and
   only for the layers that changed.
5. The answer from the copy matches the live answer, and every result says which source and
   which version of the layer it came from.

## Non-goals

- Rasters. `class_shares_in_area` keeps asking the image service, which already summarises on
  the server. Question 10 showed it also slows down on large areas (17 s for a province); that
  is a separate problem.
- A database. The proof of concept stores the copy as files; the store sits behind an interface
  so a spatial database can replace it for the whole Amazon (see "After the proof of concept").
- A tool that ranks or compares places in one call. Precomputed figures make it cheap to add;
  whether to add it is a separate decision.
- The overlap tool (AM-757). It becomes much cheaper on top of the copy, but it is designed
  separately.
- Scheduled or automatic refresh. A person runs the sync after uploading a layer.

## Anti-goals

- A copy that gives different figures from ArcGIS without saying so. A faster wrong answer is
  worse than a slow right one.
- A result that hides its source. The trace of every answer has to say whether it came from the
  copy, from precomputed figures or from ArcGIS, and from which version of the layer.
- Logic tied to the Ecuador layers: per-layer special cases, hard-coded layer ids, or a split
  tuned to one layer.

## Constraints

- No new dependency. Shapely, pyproj and httpx already cover download, split, index and measure.
- The existing clip and geodesic area code (`mcp_server.geometry.area`) stays the single way
  hectares are measured, so the copy and the live path cannot drift in method.
- Live queries simplify geometry with `maxAllowableOffset` 0.001°. The copy is downloaded with
  the same simplification, so both paths measure the same geometry.
- The server runs over stdio locally and in one container in staging. The copy has to load at
  start without a network call, and the server has to work, more slowly, without it.

## Design

### Sources and the selector

An area request names an indicator, an area (a polygon, and the place id when the user named
one) and an operation: classes present, feature count, or hectares per class (with or without
the clipped shapes for a map).

A source is anything that can answer some requests. Each source says whether it can answer a
given request, and answers it. The selector holds an ordered list of sources and uses the first
that can answer:

1. **Precomputed figures.** Hectares per class for a named place and a layer, computed during the
   sync. Answers only hectares, only for a place id, only for layers whose figures exist and
   match the current copy.
2. **Local copy.** The layer split into pieces, with a spatial index. Answers hectares per class
   (and the map shapes) for any area, for layers whose copy is current (see "Refresh").
3. **Live ArcGIS.** Today's path. Answers everything; used when neither of the above can.

The order is configuration, not code: a deployment can leave out a source, or the copy can be
switched off to measure the before and after.

### The local copy

Built per layer:

1. Download every feature of the layer, paged, with its class and its object id, at the same
   simplification as live queries.
2. Split each feature along a regular grid of square cells. Each piece keeps the class and the
   object id of the feature it came from.
3. Store the pieces with a spatial index, and a manifest per layer: the layer's
   `dataLastEditDate` from ArcGIS at download time, the cell size, the feature and piece counts,
   and the build date.

Answering from the copy:

- **Hectares per class.** Select the pieces whose bounds touch the area, clip them with the
  existing code, measure with the existing code. Map shapes come from the same clip.
Classes present and feature counts stay on live ArcGIS (designer's call, from the builder check).
They are already fast, a median of 0.23 s over 936 calls in the timing run, because ArcGIS
answers them without returning geometry. ArcGIS also tests them against full-resolution
geometry, which a copy at 0.001° could not match exactly at the edges of an area. Only hectares
download the layer, so only hectares move to the copy.

Pieces of the same feature meet along cell edges. The measurement adds up clipped pieces, so it
needs no union across cells; the existing overlap check, which compares the sum of classes with
the area, keeps working.

### Precomputed figures

During the sync, after a layer's copy is built, hectares per class are computed from the copy for
every place in the places snapshot, and stored with two versions: the copy's layer version and
the places snapshot's `generated_at`. A precomputed figure is used only when both match what the
server loaded (designer's call: a changed boundary must not leave old figures in use).

A named place still needs its boundary for `aoi_ha`, `coverage` and `outside_ha`, which today is
fetched live and cached for a day. The sync stores, next to the figures, each place's boundary
or those three values, so a precomputed answer makes no network call (designer's call; which of the two
is left to the builder).

For the module that is 151 places by 13 layers, computed offline.

### Refresh

`amazonia360-mcp-catalogue sync` already reads each layer's `editingInfo`. After it writes the
catalogue snapshot it compares each layer's `dataLastEditDate` with the copy's manifest, and
rebuilds the copy and the precomputed figures of the layers that changed. A flag rebuilds a given
layer, or all of them, regardless.

A copy answers only when its manifest's `dataLastEditDate` equals the `layer_last_edit` in the
catalogue snapshot the server loaded; otherwise the request goes to live ArcGIS (designer's call). So a
rebuild that fails part-way leaves that layer on the live path, never on stale figures. A failed
rebuild keeps the previous copy on disk, marked by its own manifest, and the sync reports the
failure.

A layer uploaded to ArcGIS but not yet synced is answered from the copy of the previous version,
labelled with that version. That follows from refresh on demand, the same as the catalogue
snapshot today.

### Getting the copy to staging

The copy is built when the container image is built: the build runs the sync and puts the copy in
the image (decided 19 October). A new layer version reaches staging with the next deployment. In
local stdio, the sync writes the copy to a directory the server reads at start. The copy is
generated, not committed.

### What the result says

`computed_over` gains two fields: the source that answered (`precomputed`, `local_copy` or
`arcgis`), and for the first two the layer version (`dataLastEditDate` of the copy). The call log
records both, with the time spent, so the trace and the before-and-after measurement come from
the same records.

### Parity

Tests compare the copy and live ArcGIS over the places used in the trials (Tena, Napo's cantons,
Yasuní, Pastaza, the 40 protected areas) and every module layer: hectares per class within a
tolerance, and the same set of classes with hectares. The live comparison runs on demand
against ArcGIS, outside the default test run, as the timing run does today. Unit tests cover the
selector, the split and the manifest with small synthetic layers.

## After the proof of concept

The file copy is the proof of concept's store. For the whole Amazon the approach is a spatial
database and an update pipeline, documented here and not built in this phase (decided
19 October).

### Store: PostGIS in the existing PostgreSQL

The server already uses a PostgreSQL database in staging: the `mcp` schema, with its own role,
holds the OAuth state and the email allowlist. The pieces of each layer, the manifests and the
precomputed figures go into tables of that database, in their own schema, with the PostGIS
extension. Against files:

- the spatial index and the clip run in the database, so the server loads nothing at start;
- several instances read the same copy;
- a new version of a layer is written to new tables and switched on in one step when it is
  complete; a failed update leaves the previous version serving;
- no image rebuild for a data change.

PostgreSQL is in the Tech Radar's Adopt tier; PostGIS is not listed and needs the team's approval
before it is used. RDS supports the extension.

The selector and the sources do not change: the database is one more implementation of the local
copy source.

### Update pipeline

Run on demand after a layer is uploaded, as a command and as a GitHub Actions workflow started by
hand:

1. **Detect.** Compare each layer's `dataLastEditDate` in ArcGIS with the version loaded.
2. **Download** the layers that changed.
3. **Split** them along the grid.
4. **Load** them into new tables.
5. **Precompute** hectares per class for every named place.
6. **Check** parity against live ArcGIS on a sample of places.
7. **Switch** to the new version.
8. **Report** what was updated and what failed, where the person who uploaded the layer sees it.

The first steps are the sync of the proof of concept; the database adds the load and the switch.

Precomputed figures grow with places times layers and are paid in the pipeline, not by the user.
The findings report (D6) and the V2.0 estimate take their figures from the before-and-after
measurement of this build.

## Decided in conversation

- Layers will keep arriving as consultants publish them; the server adapts (19 October).
- Refresh on demand after a layer upload, through the sync (19 October).
- Drawn areas and named places both matter; drawn areas are most of today's front end
  (19 October).
- Build the Ecuador version now as part of Deliverable 6 (19 October).
- The proof of concept stores the copy as files, built into the container image (19 October).
- The final version uses the existing PostgreSQL with PostGIS and an update pipeline, documented
  and not built now (19 October).

## Left to the builder

- The cell size of the grid, chosen from the measured trade-off between piece count and query
  time on the module layers, and recorded in the manifest.
- Whether the copy loads entirely at start or each layer on first use; the staging container's
  memory is not set yet. Without the copy the server falls back to live ArcGIS.
- The file format of the store and where it lives on disk, within the constraint of no new
  dependency.
- The tolerance for hectare parity, from the observed differences.
