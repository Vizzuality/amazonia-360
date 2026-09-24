# MCP trial from Claude Desktop, 24 September 2026

A first hands-on run of the phase 1 server: questions asked in Spanish from Claude Desktop, answers
checked against `mcp/var/calls.jsonl` and the catalogue. Branch `feat/mcp-module` at `edd37303`.
One question at a time, each chosen after reading the previous answer.

Status: in progress. Findings are recorded as they come; conclusions wait for the end of the round.

## Setup

Claude Desktop could not start the server through `uv`. The repository is on `/Volumes/Work`, a
volume other than the boot disk, and macOS lets Desktop's child processes enter directories there
and open files by path, but not list a directory or ask for the current one (`getcwd` and `readdir`
both return "Operation not permitted"). uv needs both and exits with "Current directory does not
exist". Granting Full Disk Access did not change it, or had not taken effect. Launching the
virtualenv's entry point directly works; the README says how.

## Calls

| # | Question | Tool, indicator | Result | Time | Vertices received |
|---|---|---|---|---|---|
| 1 | What data is there on the physical and natural environment? | `list_indicators` | 13 layers, grouped | not logged | – |
| 2 | Climate types around Tena | `categories_in_area`, 218 | 2 classes | 0.78 s | – |
| 3 | Hectares of each ecosystem around Puyo | `area_by_category`, 210 | 3 classes, 11,078 ha | **60.7 s** | **76,071** |
| 4 | Restoration actions in the same area | `count_in_area`, 202 | 291 records | 0.49 s | – |
| 5 | Hectares of each flooding regime in the same area | `area_by_category`, 214, then `categories_in_area`, 214 | empty, 0 features | 0.96 s, 0.38 s | 0 |
| 6 | Hectares of each flooding regime around Nuevo Rocafuerte | `area_by_category`, 214 (three tries, two box sizes), then `categories_in_area`, 214 | **failed**; the classes only | 0.9–2.1 s to the failure | – |

The areas were boxes of about 20 × 20 km (39,876 and 39,868 ha, 5 vertices) that Desktop drew itself
from the place names.

## What worked

- **Tool choice.** Every call used the right tool and the right layer, including 218 over the
  similar Bioclimates and Thermotypes, and `count_in_area` for 202. Question 1 shows the model read
  the `tools` field in `list_indicators`: it stated that 202 only takes `count_in_area`.
- **Descriptions used, not invented.** Counts and nuances in answer 1 (53 units, 6 climate types,
  51 ecosystems characterised in 2012, "floodability describes vegetation, not hazard") are
  `description_short` verbatim. Carbon, which has no description, was named and not described.
- **Context carried over.** Question 4 said "the same area" and the model reused the Puyo box.
- **Limits stated unprompted.** Answer 4 said the count is of records, not area, and that the tool
  gives no breakdown by modality, practice or year.
- **Arithmetic within one indicator only.** Answer 3 summed the classes of one layer and gave the
  share of the box, which is valid because the box was fully inside the module.

## Nuances

- **Caveats softened.** Answer 2 relayed the provisional-boundary caveat and then added "but Tena is
  clearly inside the Ecuadorian Amazon". True here; the server instructions ask to quote caveats,
  not to weigh them, and near the border the same habit would hide the warning that matters.
- **Speculation where the description says not to read anything.** Answer 3 said the 28,800 ha
  without a class are "most likely" towns, pasture and crops, marked as unconfirmed. The layer's
  description says areas without a polygon are not a category and that land use must be read from
  a land cover layer.
- **An empty answer the model could not interpret.** Answer 5 got no features and said it could
  not tell "the layer does not reach Puyo" from "the service is broken". Checked by hand: it is the
  first. Layer 214 maps floodable zones only, not the whole module; the Puyo box has no polygon and
  the nearest five start about 30 km east. Nothing in the result says so, and the answer could as
  easily have been read as "no flood risk in Puyo". An empty result needs a signal that tells
  "nothing mapped here" from "no data".
- **Two layers that look contradictory and are not.** The model flagged that Ecosystems gave
  343 ha of "floodable forest of the alluvial plain" in the same box. They are different products:
  a vegetation type mapped at 1:100,000 and generalised to 90 m, against a floodability layer
  (GE005) with its own delineation. The model was right to mention it and had no way to explain it.
- **The count-mismatch warning misleads on 214.** It reads "the source documentation lists 7
  records; the published service has 14,137". The 7 is the known error in the consultant's
  documentation (open question 3 in the spec): the AGOL item's own description says 14,137
  polygons intersect the module. The warning does not say which figure is believed, so the model
  took it as a sign the service might be faulty.

## Failure: invalid features that the repair could not repair

Question 6 failed three times in `area_by_category` with `GEOSException: IllegalArgumentException:
Overlay input is mixed-dimension`. The model received only "Error executing tool
area_by_category" and guessed the density of the layer; it did fall back to `categories_in_area`
and said plainly that it had the classes and not the hectares.

Cause: 97 of the 544 features ArcGIS returned for the box were invalid, almost all because the
0.001 degree `maxAllowableOffset` collapsed small rings below four points (one part came back as a
single point repeated four times). With the full geometry only 8 are invalid. `make_valid` in its
default "linework" mode raises on those collapsed rings under GEOS 3.13. It had never been hit
because the dissolved layers tried so far had no such rings.

Fixed in the branch: invalid features are repaired with `make_valid(method="structure",
keep_collapsed=False)`, which drops collapsed parts and returns polygons only. A regression test
uses the exact geometry from layer 214. The same box now answers in 1.7 s: Zonas Susceptibles
12,791 ha, Zonas Inundadas 5,784 ha, Zonas Inundables 5,499 ha.

Two things the failure showed:

- **An unexpected error reaches the model as a bare "Error executing tool".** The real message
  was only in the call log and the Desktop log. Refusals raised as `HandlerError` reach the model
  in full; everything else does not.
- **Simplification costs accuracy on small polygons.** Against the unsimplified geometry the same
  box gives 5,507, 5,904 and 12,888 ha: the simplified figures are 0.1 %, 2.0 % and 0.8 % low.
  Zonas Inundadas, made of small patches, loses most.

## Time

`area_by_category` on ecosystems took 60.7 s for a 40,000 ha box: 58.8 s in ArcGIS, 1.9 s clipping,
76,071 vertices received for three features.

Probable cause, not yet verified: layer 210 is dissolved, one multipart feature per class across
the whole module. A feature service query does not clip, so any box that touches a class receives
all of that class's parts. The cost then follows the complexity of the classes touched, not the size
of the area asked about. If so, undissolved layers (214, 219, 209) should be much cheaper for the
same box, and the 0.001 degree `maxAllowableOffset` does not help the server read time.

Question 6 supports the hypothesis. On layer 214, undissolved, a box of the same size returned
544 features and 10,987 vertices in 1.6 s; without any simplification, 331,563 vertices in 4.1 s.
Layer 210 returned 3 features and 76,071 vertices in 58.8 s. The time is not in the vertices
transferred but in the server reading very large multipart features. Not yet checked on a second
dissolved layer.

The call came close to the 60 s ArcGIS timeout (`ARCGIS_TIMEOUT_S`). It did not fail because httpx
applies the timeout between bytes, not to the whole request.

The two fast tools were 0.49 and 0.78 s, above the 0.19–0.37 s measured earlier; the first call of
a session probably includes connection setup.

## To check

- The dissolve hypothesis on a second dissolved layer (204, 217 or 218) with the same box.
- Whether server read time changes with `maxAllowableOffset`.
- Whether Desktop warned before the slow call; the tool's description says it is slow.
