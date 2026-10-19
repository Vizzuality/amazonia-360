# MCP layer store: parity, cell size and timing, 19 October 2026

What the local layer copy changes for `area_by_category`, measured against live ArcGIS Online:
whether it gives the same figures, which cell size to cut it with, and how much faster it is.

Status: parity, cell size and timing done. Question 19 in Claude Desktop is still to be run.

## Conclusions

- **After layer 203 (AM-766) the copy still gives ArcGIS's figures.** Rebuilt with the same
  0.001 download as before, and the parity test run on all 12 layers: 11 pass and 203 misses by
  one figure (Tambillo / Alta, copy 30.64 ha, live 27.30 ha). See "Layer 203".
- **First run, 11 layers, 48 places:** the same classes in every case, and every class within
  `max(1 ha, 0.5 % of the live figure)`. The second run (below) gave the same for those 11.
- **The ArcGIS-only median `area_by_category` call on the three trial boxes runs from 144 ms to
  7.2 s per layer, depending on the layer; with the copy it is 1 to 21 ms**
  on every layer with a copy. The slowest copy call in the run was 436 ms (layer 210, the first
  call, which loads the layer from disk).
- **Cell size barely matters.** 0.05, 0.1 and 0.25 degrees differ by under 4 % on the slowest
  question, so `DEFAULT_CELL_DEG` stays at 0.1.
- **A large protected area is still slow on the copy.** Yasuní on layer 210 takes about 8.6 s from
  the copy, at any cell size. The time is the clip of about 11,000 pieces, not finding them.
  See "Cell size".
- **Layer 203 now has a copy** (AM-766), and live `area_by_category` returns its four classes.
  In Tena the copy and live agree to the hectare. In the timing table below 203 is still the
  run made without a copy.

## Parity

`mcp/tests/live/test_layer_store_parity.py` (`uv run pytest -m live tests/live/test_layer_store_parity.py`).
It reads the store at `MCP_LAYER_STORE` (default `var/layer-store`) and skips with a reason when
there is none.

- Layers: the 11 with a copy, 204, 206, 208, 209, 210, 211, 214, 217, 218, 219 and 222.
- Places, 48: Pastaza, Tena, the five cantons of Napo (Tena among them), Yasuní, and the 40
  protected areas (Yasuní is one of them, so the list is deduplicated). The area sent to both
  sources is the boundary kept in the store, so the two answer the same polygon.
- `LocalCopySource` and `ArcGISSource` (simplification 0.001, as the server uses it) are asked
  for each layer and place. The test requires the same set of classes, and per class
  `abs(copy - live) <= max(1.0, 0.005 * live)` hectares.
- Result: 12 passed in 10 min 39 s (the 11 layers and a check on the place list). No class
  missed the tolerance, so it was not changed.

The first run failed once, on layer 206, with `Server disconnected without sending a response` from
ArcGIS Online. The test now repeats a live query once when ArcGIS errors; the second run was clean.

In that first run layer 203 was excluded: ArcGIS serves 3 of its 4 features in Web Mercator
metres labelled 4326 when the query carries `maxAllowableOffset`, and the store build refused it.

## Layer 203

Cause, checked with curl on 19 October: with `outSR=4326` alone all four features come back in
degrees; with `outSR=4326&maxAllowableOffset=0.001` three come back in Web Mercator metres (first
vertex about -8818325, -548884) while the response declares wkid 4326.

Change (AM-766): the live query (`ArcGISClient.features`) and the build's whole-layer download
(`layer_features`) detect a page outside longitude [-180, 180] / latitude [-90, 90] and repeat the
query without `maxAllowableOffset`. If that still returns such coordinates they raise an error
naming the layer. The build keeps downloading every layer with the same 0.001 as the live path.
A first attempt, downloading at full resolution and simplifying with shapely, was dropped: at
0.001 shapely's simplification loses 12 to 50 % of the thin classes of layer 208 in Tena, and the
copy and live no longer measured the same geometry.

Layer 203 in Tena (`canton:Napo/Tena`), hectares, live now and the rebuilt copy:

| Class | ArcGIS live | Copy |
|---|---|---|
| Muy alta | 14,331.56 | 14,331.56 |
| Alta | 39,557.94 | 39,557.94 |
| Media | 4,278.59 | 4,278.59 |
| Baja | 2,139.33 | 2,139.33 |

Before the change the live call returned only "Alta", 39,584 ha. Live takes about 50 s here, because
the repeat is a query without generalisation.

Store rebuilt with `store --rebuild-all` (12 layers, 151 boundaries, no errors): 5 min 3 s in all,
layers and places. The store is 53 MB on disk (47 MB in `layers`, 33 MB of it layer 203). The
previous store, without 203, was 19 MB (13.5 MB in `layers`) and its layers took about 2 min.
Those two times are not like for like: the earlier one is read from the manifests, this one is the
whole command. Layer 203 is large because the repeat without generalisation keeps its full detail.

### Parity with 203 included

`uv run pytest -m live tests/live/test_layer_store_parity.py -v`: **12 passed, 1 failed** in
22 min 33 s (the 12 layers plus the check on the place list). The live query is now repeated up to
three times, with 2 and 4 s of wait, when ArcGIS fails; no layer failed on a network error. The
failure is layer 203, one figure: `protected_area:Tambillo / Alta`, copy 30.64 ha, live 27.30 ha.

The cause is that the repeat depends on the query. For the Tambillo area ArcGIS answers the
generalised query in degrees, so live keeps the generalised geometry (27.30 ha); the whole-layer
download does get metres, so the copy keeps the layer as stored (30.64 ha, which is also what
full resolution gives for Tambillo). The tolerance was not changed. Closing it would take
either always downloading 203 without generalisation on the live path or a rule in the parity test.

### ArcGIS's generalisation against the layer as stored

A property of today's live figures, independent of the store. Tena, hectares:

| Layer, class | ArcGIS at 0.001 | Layer as stored |
|---|---|---|
| 208 Pastizal | 1,849.27 | 1,841.07 |
| 208 Mosaico Agropecuario | 240.58 | 228.72 |
| 208 Area sin Cobertura Vegetal | 6.54 | 6.18 |
| 219 Páramo (Tambillo) | 1,012.53 | 1,001.57 |

On 208 the generalised figure is 0.4 to 6 % off the stored layer per class; on 219 about 1 %.
The copy and live share that difference, so it is not a parity matter.

## Cell size

Layers 208 and 210 rebuilt at three cell sizes, into temporary stores (since deleted). Time is the
median of five warm calls to `LocalCopySource.measure` (the layer already loaded, as in the
running server). Load is the one-off read of the layer from disk.

| Cell | Pieces 208 | Pieces 210 | Load 210 | Tena 208 | Tena 210 | Yasuní 208 | Yasuní 210 | Build, both layers |
|---|---|---|---|---|---|---|---|---|
| 0.05 | 36,237 | 70,033 | 0.47 s | 0.03 s | 0.04 s | 0.17 s | 9.59 s | 118 s |
| 0.1 | 35,239 | 58,249 | 0.42 s | 0.03 s | 0.04 s | 0.17 s | 8.57 s | 88 s |
| 0.25 | 34,641 | 52,037 | 0.38 s | 0.03 s | 0.04 s | 0.17 s | 8.29 s | 77 s |

Tena is where the cell could matter and it does not: 0.03 and 0.04 s everywhere. On Yasuní, 0.25 is
3 % faster than 0.1 and 0.05 is 12 % slower. That is within what one run can tell apart, and it
costs nothing to keep the value in use. `DEFAULT_CELL_DEG` stays at 0.1.

What the table does show is that the cell is not what limits Yasuní. A cell only sets how many
pieces are found for an area, and 0.25 still returns about 10,000 of them for Yasuní on layer 210.
The 8 to 10 s goes to clipping them against the boundary. A faster answer there would need a
change in the clip (for example, skipping pieces that lie wholly inside the area), which is
outside this task.

## Timing

`uv run amazonia360-mcp-timing run --rounds 1 --sources arcgis` and the same without `--sources`
(order `precomputed, local_copy, arcgis`, from the store at `var/layer-store`). One round each:
the three trial boxes (Puyo, Tena, Nuevo Rocafuerte) from `mcp/examples/areas.geojson`, every tool
on every layer it applies to, 75 calls, no errors in either. The calls are one after another, and
the two runs were not run at the same time. Logs: `mcp/var/timing-arcgis.jsonl` and
`mcp/var/timing-store.jsonl` (not committed).

`area_by_category`, median of three calls per layer, from `summary`:

| Layer | ArcGIS only | With the store | Max with the store |
|---|---|---|---|
| 203 Restoration priority areas | 29.4 s | 30.9 s (no copy) | 31.8 s |
| 204 Bioclimates | 523 ms | 1 ms | 10 ms |
| 206 Carbon by forest stratum | 7.2 s | 11 ms | 418 ms |
| 208 Deforestation 2020-2022 | 5.5 s | 4 ms | 195 ms |
| 209 Hydrographic demarcations | 495 ms | 1 ms | 8 ms |
| 210 Ecosystems | 3.6 s | 21 ms | 436 ms |
| 211 Geomorphology | 2.1 s | 2 ms | 70 ms |
| 214 Flooding regime | 280 ms | 17 ms | 113 ms |
| 217 Thermotypes | 659 ms | 1 ms | 37 ms |
| 218 Climate types | 261 ms | 1 ms | 10 ms |
| 219 Biogeographic Units | 1.4 s | 1 ms | 62 ms |
| 222 Water Recharge Zone | 144 ms | 1 ms | 1 ms |

With only three calls per layer, the medians are indicative. The 203 rows are the same in both
runs, which is expected: it fell through to ArcGIS, because that store had no copy of it.
The boxes are 20 km across; the Yasuní case is the harder one and is below.

### Yasuní on layer 210, ArcGIS only against the copy

`protected_area:Yasuní`, `area_by_category`, three consecutive calls each, 19 October, with the
final rebuilt store:

| Source | Call 1 | Call 2 | Call 3 |
|---|---|---|---|
| ArcGIS only | 16.4 s | 17.7 s | 15.3 s |
| Copy (warm, as in the running server) | 9.7 s | 9.3 s | 9.4 s |

The copy is about 40 % faster than ArcGIS even on the hardest area, so the default order
(`precomputed, local_copy, arcgis`) is not a regression for large areas. Neither is fast. ArcGIS
took 14.4 to 15.8 s in an earlier measurement the same day, so the live figure moves by a few
seconds; the copy's 9.3 to 9.7 s is about 1 s above the 8.6 s of the cell-size table.

## Question 19 in Claude Desktop

To be run. Total time and number of areas checked, to compare with round 4 of the Desktop trial.
