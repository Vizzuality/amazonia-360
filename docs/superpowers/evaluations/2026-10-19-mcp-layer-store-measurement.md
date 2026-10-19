# MCP layer store: parity, cell size and timing, 19 October 2026

What the local layer copy changes for `area_by_category`, measured against live ArcGIS Online:
whether it gives the same figures, which cell size to cut it with, and how much faster it is.

Status: parity, cell size and timing done. Question 19 in Claude Desktop is still to be run.

## Conclusions

- **Superseded on 19 October, after layer 203 (AM-766).** The copy is now downloaded at full
  resolution and simplified here with shapely, not generalised by ArcGIS. Of the 12 layers the
  parity test now covers, 5 pass, 5 miss the tolerance by 0.5 to 2 % on a few classes (210, 211,
  214, 217, 219), 208 misses it by up to 20 %, and 203 and 206 did not finish on a network error.
  See "Layer 203 and the change of download". The paragraphs below describe the first run, made
  with ArcGIS's own generalisation.
- **The copy gave ArcGIS's figures (first run).** 11 layers against the 48 places below: the same
  classes in every case, and every class within `max(1 ha, 0.5 % of the live figure)`.
- **The ArcGIS-only median `area_by_category` call on the three trial boxes runs from 144 ms to
  7.2 s per layer, depending on the layer; with the copy it is 1 to 21 ms**
  on every layer with a copy. The slowest copy call in the run was 436 ms (layer 210, the first
  call, which loads the layer from disk).
- **Cell size barely matters.** 0.05, 0.1 and 0.25 degrees differ by under 4 % on the slowest
  question, so `DEFAULT_CELL_DEG` stays at 0.1.
- **A large protected area is still slow on the copy.** Yasuní on layer 210 takes about 8.6 s from
  the copy, at any cell size. The time is the clip of about 11,000 pieces, not finding them.
  See "Cell size".
- **Layer 203 now has a copy** (AM-766). Its figures differ from live by 1.6 to 9.8 % per class,
  so the copy is not yet within the tolerance. In the timing table below it is still the
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

## Layer 203 and the change of download

Cause, checked with curl on 19 October: with `outSR=4326` alone all four features come back in
degrees; with `outSR=4326&maxAllowableOffset=0.001` three come back in Web Mercator metres (first
vertex about -8818325, -548884) while the response declares wkid 4326.

Changes (AM-766):

- The live query (`ArcGISClient.features`) detects a page outside longitude [-180, 180] / latitude
  [-90, 90] and repeats the query without `maxAllowableOffset`. If that still returns such
  coordinates it raises an error naming the layer.
- The build downloads every layer with no `maxAllowableOffset` and simplifies each feature here with
  `shapely.simplify(geom, 0.001, preserve_topology=True)`, the same 0.001 degrees as the live path.

Store rebuilt with `store --rebuild-all` (12 layers, 151 boundaries, no errors):

| | Before (11 layers, ArcGIS generalised) | After (12 layers, full resolution, shapely) |
|---|---|---|
| Rebuild time | about 2 min for the layers (from the `built_at` of the first and last manifest); places not timed | 6 min 10 s in all, layers and places |
| Store size on disk | 19 MB (13.5 MB in `layers`) | 39 MB (33 MB in `layers`; layer 203 alone is 10 MB, the other 11 layers 23 MB) |

The two times are not like for like: the first is read from the manifests of the earlier build, the
second is the whole command. Full-resolution downloads were practical for every layer (none hit the
page limit; the build finished in minutes), so the size and time are the cost, not a blocker.

Layer 203 in Tena (`canton:Napo/Tena`), hectares:

| Class | ArcGIS live | Full resolution | Copy |
|---|---|---|---|
| Muy alta | 14,331.56 | 14,331.56 | 14,015.46 |
| Alta | 39,557.94 | 39,557.94 | 38,930.85 |
| Media | 4,278.59 | 4,278.59 | 3,878.09 |
| Baja | 2,139.33 | 2,139.33 | 1,929.64 |

The live path now returns all four classes (before: only "Alta", 39,584 ha). Live and full
resolution are identical here because the repeat of the query is itself without generalisation. The
copy is 2 to 10 % under both.

### Parity after the change

`uv run pytest -m live tests/live/test_layer_store_parity.py -v`, with 203 no longer excluded:
**5 passed, 8 failed** in 12 min 39 s (the run was repeated, 12 min 53 s and 12 min 39 s, with the
same result). The failures:

- 203 and 206: `httpx.ReadError` from ArcGIS Online on both attempts of a query (the test repeats
  a failed live query once). These say nothing about parity. 203 live in Tena takes about 50 s here.
- 210, 211, 214, 217, 219: one to three classes per layer just over the tolerance, for example 219
  Sumaco Napo-Galeras / Páramo, copy 266.18 ha, live 262.76 ha (1.3 %); 210 Pastaza / Herbazal
  inundado lacustre-ripario, 975.39 against 982.49 ha (0.7 %).
- 208: 62 class and place figures out of tolerance, up to 20 % (Tena / Pastizal, copy 1,525.96 ha,
  live 1,849.27 ha), and five places where the copy has a small class that live does not.

Which side is right, against the layer as stored (no generalisation), in Tena:

| Layer, class | ArcGIS 0.001 | Full resolution | Copy |
|---|---|---|---|
| 208 Pastizal | 1,849.27 | 1,841.07 | 1,525.96 |
| 208 Mosaico Agropecuario | 240.58 | 228.72 | 200.11 |
| 208 Area sin Cobertura Vegetal | 6.54 | 6.18 | 3.08 |
| 219 Páramo (Tambillo) | 1,012.53 | 1,001.57 | 1,018.40 |

On 208, ArcGIS's generalisation stays within 0.4 to 6 % of the stored geometry, and shapely's
simplification at the same tolerance loses 12 to 50 % of these classes. On 219 both are about
1 % over. So the shared 0.001 is not equivalent between the two algorithms, and the parity
tolerance was set against ArcGIS's. The data is not conclusive on what to do (a smaller local
tolerance, or no local simplification at the cost of a slower clip) and this was not tried.

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
store rebuilt as above:

| Source | Call 1 | Call 2 | Call 3 |
|---|---|---|---|
| ArcGIS only | 14.4 s | 14.9 s | 15.8 s |
| Copy (warm, as in the running server) | 9.9 s | 9.7 s | 9.9 s |

The copy is about a third faster than ArcGIS even on the hardest area, so the default order
(`precomputed, local_copy, arcgis`) is not a regression for large areas. Neither is fast. The copy
time is about 1.2 s above the 8.6 s of the cell-size table, which used the generalised copy; the
full-resolution copy has 58,874 pieces on layer 210 against 58,249.

## Question 19 in Claude Desktop

To be run. Total time and number of areas checked, to compare with round 4 of the Desktop trial.
