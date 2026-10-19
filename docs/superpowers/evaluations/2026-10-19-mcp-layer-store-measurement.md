# MCP layer store: parity, cell size and timing, 19 October 2026

What the local layer copy changes for `area_by_category`, measured against live ArcGIS Online:
whether it gives the same figures, which cell size to cut it with, and how much faster it is.

Status: parity, cell size and timing done. Question 19 in Claude Desktop is still to be run.

## Conclusions

- **The copy gives ArcGIS's figures.** 11 layers against the 48 places below: the same classes in
  every case, and every class within `max(1 ha, 0.5 % of the live figure)`.
- **The median `area_by_category` call on the three trial boxes goes from 0.3 to 7 s to 1 to 21 ms**
  on every layer with a copy. The slowest copy call in the run was 436 ms (layer 210, the first
  call, which loads the layer from disk).
- **Cell size barely matters.** 0.05, 0.1 and 0.25 degrees differ by under 4 % on the slowest
  question, so `DEFAULT_CELL_DEG` stays at 0.1.
- **A large protected area is still slow on the copy.** Yasuní on layer 210 takes about 8.6 s from
  the copy, at any cell size. The time is the clip of about 11,000 pieces, not finding them.
  See "Cell size".
- **Layer 203 has no copy** and is left out of every comparison below.

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

Layer 203 is excluded: ArcGIS serves 3 of its 4 features in Web Mercator metres labelled 4326, and
the store build refuses it. It answers from ArcGIS only.

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
| 219 | 1.4 s | 1 ms | 62 ms |
| 222 | 144 ms | 1 ms | 1 ms |

With only three calls per layer, the medians are indicative. The 203 rows are the same in both
runs, which is expected: it falls through to ArcGIS. The boxes are 20 km across; the Yasuní case
in the cell-size table is the harder one, and was not in this run.

## Question 19 in Claude Desktop

To be run. Total time and number of areas checked, to compare with round 4 of the Desktop trial.
