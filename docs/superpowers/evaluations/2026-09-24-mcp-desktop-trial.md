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
| 7 | Question 6 again, after the fix | `area_by_category`, 214 | 3 classes, 24,254 ha (61 %) | 1.38 s | 10,663 |
| 8 | Hectares of each climate type around Puyo | `area_by_category`, 218 | 2 classes, 39,868 ha (100 %) | 0.70 s | 1,875 |
| 9 | Hectares of each forest stratum around Puyo | `area_by_category`, 206 | 2 strata, 11,810 ha (30 %) | 6.66 s | 333,834 |

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

## After the fix

Question 7 repeated question 6 after restarting Desktop: 507 features, 1.38 s, three classes. The
figures differ from the check made by hand (12,791 / 5,784 / 5,499 ha) because Desktop drew its box
slightly elsewhere; same size, 39,876 ha.

- **Border caveat handled well, for the wrong reason.** The box is centred on a border town, so
  part of it very likely falls in Peru; the provisional envelope reaches -75.189 and reports
  "inside". The model said the unclassified 15,600 ha could be dry land or the part of the box
  outside Ecuador. That is the case the provisional caveat exists for, and the model reached it,
  but the MCP could not tell it the box was partial.
- **Carbon caveat respected** (question 9). The model said the layer gives a mean t/ha per
  stratum and that the tool neither returns it nor computes total carbon; it did not multiply.
  It also checked the strata total (11,810 ha) against the ecosystems total in the same box
  (11,078 ha) and called them consistent. They are 7 % apart, from two different products;
  "consistent" is generous but not wrong.
- **The fixed bug read as "intermittent".** The model said the earlier failures seemed
  intermittent. It had no way to know they were a bug fixed between calls; the generic error
  message gave it nothing to reason with.
- **The floodability nuance carried through** ("describes vegetation, not flood risk").

## Time

| Call | Layer | Features | Vertices received | ArcGIS | Clip | Total |
|---|---|---|---|---|---|---|
| Q3, Desktop | 210 Ecosystems | 3 | 76,071 | 58.8 s | 1.9 s | 60.7 s |
| Rerun by hand, twice | 210 Ecosystems | 3 | 76,071 | 2.9 s, 3.1 s | 0.5 s | 3.4 s, 3.5 s |
| Q7 | 214 Flooding, undissolved | 507 | 10,663 | 1.3 s | 0.06 s | 1.4 s |
| Q8 | 218 Climate types | 2 | 1,875 | 0.7 s | 0.00 s | 0.7 s |
| Q9 | 206 Carbon | 2 | 333,834 | 4.5 s | 2.2 s | 6.7 s |
| Rerun by hand | 206 Carbon | 2 | 333,834 | 4.9 s | 2.2 s | 7.1 s |

**The 60 s call was an outlier on the ArcGIS side, and both hypotheses built on it were wrong.**
The same query on layer 210, returning the same 76,071 vertices, took 2.9 and 3.1 s in ArcGIS
when rerun. Two explanations were tried first and discarded:

- *Dissolved layers are slow.* Layer 218 is dissolved and took 0.7 s (question 8).
- *Cost follows the vertices of the features touched.* Carbon returned four times as many
  vertices as Ecosystems and took 4.5 s in ArcGIS (question 9).

The cause of the minute is not known. It was the first query on layer 210 of the session, so a
cold start of the hosted service is plausible, but Carbon was also queried for the first time and
was not slow. The earlier live suite saw the same thing: a 59 s count on layer 202 that did not
repeat. What can be said is that ArcGIS Online sometimes takes a minute on a query that normally
takes three seconds, which is enough to hit the 60 s timeout.

Once the outlier is set aside, time does follow vertices received, at a moderate rate: about
0.7 s for 2,000 vertices, 3 s for 76,000, 4.5–5 s for 334,000 in ArcGIS, with the local clip adding
about 2 s per 300,000 vertices. The 0.001 degree simplification is what keeps these numbers low:
layer 214 without it returned 331,563 vertices instead of 10,987 for the same box.

The two fast tools were 0.49 and 0.78 s, above the 0.19–0.37 s measured earlier; the first call of
a session probably includes connection setup.

## To check

- How often ArcGIS takes a minute, and whether it is tied to the first query on a service. Needs
  repeated timed runs over hours, not one session.
- Whether server read time changes with `maxAllowableOffset`.
- Whether Desktop warned before the slow call; the tool's description says it is slow.
