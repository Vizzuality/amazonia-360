# MCP trial from Claude Desktop, 24 September 2026

A first hands-on run of the phase 1 server: questions asked in Spanish from Claude Desktop, answers
checked against `mcp/var/calls.jsonl` and the catalogue. Branch `feat/mcp-module` at `edd37303`.
One question at a time, each chosen after reading the previous answer.

Status: round finished. Eleven questions, one bug found and fixed in the session, five changes
proposed and not yet made.

## Conclusions

**The model side works better than expected.** In eleven questions the model always picked the
right tool and the right layer, read the `tools` field instead of guessing, took descriptions
from the catalogue instead of inventing them, reused an area across turns, respected the Carbon
caveat, refused a cross-indicator sum and explained a refusal outside the module without looking
for the data elsewhere. None of the problems found is a wrong number given as right.

**Where it goes wrong, it is because the MCP gave it too little to reason with.** Every nuance
below traces back to the server: an empty result with no meaning attached, an error with no
message, a warning that does not say which figure to believe, a module boundary that cannot say
"partial". The model filled those gaps with guesses, marked as guesses, and some were wrong
("the earlier failures seemed intermittent").

**Latency is acceptable, with one exception that is not ours.** Area over a 40,000 ha box takes
0.7 to 10 s depending on the vertices the layer returns. The one minute-long call was an ArcGIS
Online outlier that did not repeat. For the aggregation decision this phase exists to inform, the
measurements so far do not argue for a grid or precomputation on latency alone; they argue for
handling ArcGIS outliers.

**The trial found a real bug** that tests had not: simplification collapses small rings and the
default repair raised on them. Fixed in `2a6e9cb4`. A live question on an undissolved layer was
enough to hit it.

## Proposed changes

In order of what the trial showed to matter most. None is made yet.

1. **Unexpected errors reach the model with their message.** Today only `HandlerError` does;
   anything else arrives as "Error executing tool". Wrap them in the tool layer, keeping the
   message and dropping the traceback.
2. **An empty result says what empty means.** For a layer that does not cover the module wall to
   wall (214, 210), zero features means "nothing mapped here", not "no data" and not "absent".
   Needs a flag in the catalogue per layer, and a caveat added to empty results.
3. **The count-mismatch warning on 214 and the four other layers.** Either say which figure is
   believed (the AGOL item agrees with the service) or leave the warning out until the consultant
   corrects the documentation, which is open question 3 of the spec.
4. **Caveats quoted, not weighed, and a rule on derived figures.** Strengthen the server
   instructions against softening a caveat, and decide whether a range built from two indicators
   (question 11) counts as combining them.
5. **ArcGIS outliers.** A query that normally takes 3 s once took a minute, near the 60 s
   timeout. Options: one retry on timeout, a longer timeout for `area_by_category`, or a result
   that says the source was slow. Needs the repeated measurements listed under "To check" first.

Not proposed, because they wait for the module polygon (`ECU_MOD_POLIG_LIMITE_WGS84`): a real
"partial" status near the border, and `aoi_inside_ha`.

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
| 10 | Ecosystems around Iquitos (Peru) | `categories_in_area`, 210 | refused: outside the module | 0 ms, no ArcGIS call | – |
| 11 | Total hectares of forest and floodable zones around Nuevo Rocafuerte | `area_by_category`, 206; 214 reused from question 7 | declined to sum; gave a range | 10.3 s | 543,521 |

## What each question was for

| # | Intent | What was watched |
|---|---|---|
| 1 | Discovery with no area and no network | Whether it calls `list_indicators` unprompted, lists all 13 layers, uses `description_short` instead of inventing, and what it says of Carbon, which has no description |
| 2 | First area, fast tool | How it turns "around Tena" into coordinates, whether it picks 218 over Bioclimates and Thermotypes, whether it relays the provisional-boundary caveat |
| 3 | The slow tool, the one this phase exists to measure | Whether it warns that the call is slow, real time and vertices received, whether the hectares add up to the box, whether it invents a total or share the MCP did not give |
| 4 | Context from the previous turn, count tool | Whether it reuses the Puyo box, picks `count_in_area` on 202, relays a count-mismatch warning if there is one |
| 5 | Dissolve hypothesis: the same box on an undissolved layer | Time against question 3 |
| 6 | The same test where layer 214 has features, on a border town | Time; whether the border caveat is softened again; whether it warns about the slow call |
| 7 | Question 6 again, after fixing the failure | That it answers, the time, the border caveat |
| 8 | Dissolve hypothesis on a second dissolved layer | Time on the same Puyo box as question 3 |
| 9 | Vertex hypothesis on the layer expected to be slowest; a caveat that forbids a derived figure | Time; whether it multiplies hectares by t C/ha against the Carbon caveat |
| 10 | Refusal outside the module | How it explains the refusal, whether it looks for the data elsewhere |
| 11 | A sum across two overlapping indicators, which the instructions forbid | Whether it sums, refuses, or explains the overlap |

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
- **Refusal outside the module** (question 10). The server refused before calling ArcGIS, and the
  model told the user plainly that Iquitos is in Peru and the module covers the Ecuadorian Amazon
  only. It chose the cheap tool for the attempt and did not look for the data elsewhere.
- **No sum across indicators** (question 11). It refused the total, said the two layers overlap
  and the tool computes no intersection, and noted that the two figures together exceed the box.
  It reused the flooding figures from question 7 instead of calling again, and called only Carbon.
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
- **A derived range from two indicators.** Question 11 went on to bound the union: between
  32,320 ha (all floodable land is forest) and 39,876 ha (the whole box). The arithmetic is right
  and the answer is useful, but it is a figure built from two indicators, which is what the server
  instructions rule out. Whether a bound counts as a combination is a rule to decide, not a bug.

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

## Questions 7 to 9

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
| Q11 | 206 Carbon, Nuevo Rocafuerte | 2 | 543,521 | – | – | 10.3 s |

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
- Whether Desktop warned before the slow call; the tool's description says it is slow. Not seen in
  the answers passed on, which do not show the intermediate messages.
- The accuracy cost of the 0.001 degree simplification across more layers than 214.
