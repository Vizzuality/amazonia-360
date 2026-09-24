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
