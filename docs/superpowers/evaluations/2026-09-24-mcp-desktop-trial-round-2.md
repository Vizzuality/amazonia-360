# MCP trial from Claude Desktop, round 2, 24 September 2026

The eleven questions of [round 1](2026-09-24-mcp-desktop-trial.md), asked again in the same order
after changes 1 to 4 of that round (`8005cce1`). Two aims: see whether those changes fixed what
they were meant to, and take a second set of timings for change 5, the ArcGIS outliers.

Same setup as round 1: Claude Desktop, questions in Spanish, answers checked against
`mcp/var/calls.jsonl` (round 2 starts at line 15) and the catalogue.

Status: in progress.

## Calls

| # | Question | Tool, indicator | Result | Time | Vertices received | Round 1 time |
|---|---|---|---|---|---|---|
| 1 | What data is there on the physical and natural environment? | `list_indicators` | 13 layers, grouped | not logged | – | not logged |
| 2 | Climate types around Tena | `categories_in_area`, 218 | 3 classes | 0.52 s | – | 0.78 s |
| 3 | Hectares of each ecosystem around Puyo | `area_by_category`, 210 | 5 classes, 41,129 ha (46 %) | 4.08 s (3.51 in ArcGIS) | 89,411 | 60.7 s |
| 4 | Restoration actions in the same area | `count_in_area`, 202 | 536 records | 0.55 s | – | 0.49 s |
| 5 | Hectares of each flooding regime in the same area | `area_by_category`, 214 | empty, with the new caveat | 0.55 s | 0 | 0.96 s, 0.38 s |
| 6 | Hectares of each flooding regime around Nuevo Rocafuerte | `area_by_category`, 214 | 3 classes, 52,642 ha (59 %), first try | 3.04 s | 15,902 | failed 3 times |
| 7 | Skipped: question 6 already answered first time | – | – | – | – | 1.38 s |
| 8 | Hectares of each climate type around Puyo | `area_by_category`, 218 | 2 classes, 89,704 ha (100 %) | 0.63 s | 1,875 | 0.70 s |
| 9 | Hectares of each forest stratum around Puyo | `area_by_category`, 206 | 2 strata, 41,323 ha (46 %) | 5.09 s (2.87 in ArcGIS) | 333,834 | 6.66 s |
| 10 | Ecosystems around Iquitos (Peru) | `categories_in_area`, 210 | refused: outside the module | 0 ms, no ArcGIS call | – | 0 ms |

## Findings

- **Q1, no regression.** Same tool, all 13 layers, descriptions taken from `description_short`,
  202 correctly given as the only count layer. Carbon named without a description, as before. The
  grouping differs (forest now its own group, offered "if you count it as natural environment"),
  which is the model's wording, not a change in the catalogue.

- **Q2, caveat still softened: the instruction change did not fix it.** The answer again adds
  "although Tena is clearly inside" to the provisional-boundary caveat, word for word the round 1
  habit, despite the new instruction to quote caveats without reassurance. The box is also
  different: about 15 km around Tena, 89,720 ha against 39,876 in round 1, so the third class
  (Ecuatorial mesotérmico semihúmedo) is a larger area, not a change in the data. New and good:
  it said unprompted that the tool gives presence only and that hectares need the slower tool.

- **Q3, no outlier this time; the new caveat half worked.** 4.08 s on a box more than twice as
  large as round 1's (89,704 ha), with 89,411 vertices: in line with the reruns by hand, not with
  the minute. On the unclassified 48,600 ha, the model now repeats the caveat (they have no class
  in this layer and are not a category of their own) and then still adds "most likely intervened
  areas, pasture, crops or the town, but the layer does not confirm it". The caveat changed what it
  states as fact, not the guess after it.

- **Q4, no regression.** Same box reused, right tool and layer, and the same unprompted limits:
  records, not restored area, no breakdown. 536 against 291 in round 1 because the box is larger.

- **Q5, fixed.** The empty result now arrives with its meaning, and the model relays it: nothing
  of the layer is mapped in the box, which is not missing data. No "maybe the service is broken".
  It still flags the 598 ha of floodable forest in Ecosystems and suggests reviewing layer 214's
  coverage. That is reasonable from where it stands; the catalogue has nothing to say that the two
  are different products with different delineations. A caveat on 214 written by a person would
  be the place for it, and that is curation for the CMS.

- **Q6, answers first time**, 898 features in 3.04 s. The partial-layer caveat reached the answer
  ("the rest has no class in this layer"). The border went the other way from round 1: the model
  now states as fact that "part of that unclassified area falls in Peru, where the layer does not
  reach", and does not mention that the boundary check is provisional. The MCP reported the box as
  "inside" on the provisional envelope, so the claim is the model's own. It is probably true of a
  box centred on a border town, but nothing the server returned supports it, and the caveat that
  should have qualified it is gone from the answer.

- **Q8, as expected.** The two classes cover the box (77,798 + 11,906 = 89,704 ha). The model
  contrasted this layer, which covers the whole box, with the partial ones; it inferred that from
  the numbers, since no caveat is added for a layer that covers the module.

- **Q9, Carbon caveat respected again**: it says the layer holds a mean t/ha per stratum and that
  the tool neither returns it nor computes total carbon. Then it compares the strata total with the
  ecosystems total from question 3 (41,323 against 41,129 ha), calls them consistent and concludes
  "the rest would be non-forest". Two things against the round 2 instructions: a conclusion drawn
  from two indicators, and a meaning given to unclassified hectares that the partial-layer caveat
  says are not a class. The conclusion happens to be right for Carbon, whose source excluded the
  NO BOSQUE class, but the model could not know that from what the MCP returned.

- **Q10, no regression.** Refused before ArcGIS, explained plainly, no search elsewhere.

## What each question checks this time

| # | Round 1 finding | What should change |
|---|---|---|
| 1 | Worked | Nothing; regression check |
| 2 | Provisional-boundary caveat softened ("Tena is clearly inside") | Caveat quoted as it is |
| 3 | 60.7 s outlier; unclassified hectares guessed as "towns and pasture" | Time; the new caveat says unclassified hectares are not a class |
| 4 | Worked | Nothing; regression check |
| 5 | Empty result read as "maybe the service is broken" | The new caveat says nothing is mapped there |
| 6 | Failed on collapsed rings; model got a bare error | Answers (fixed in round 1) |
| 7 | Border caveat reached for the wrong reason; fixed bug read as "intermittent" | Caveat quoted; nothing to call intermittent |
| 8 | Worked | Time |
| 9 | Carbon caveat respected | Time |
| 10 | Refusal handled well | Nothing; regression check |
| 11 | No sum, but a range built from two indicators | No range: each figure on its own |
