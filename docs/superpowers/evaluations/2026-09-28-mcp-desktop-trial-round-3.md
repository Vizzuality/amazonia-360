# MCP trial from Claude Desktop, round 3, 28 September 2026

Four questions of [round 2](2026-09-24-mcp-desktop-trial-round-2.md) asked again: Q3, Q5, Q6 and
Q9. Between the rounds, the facts the server used to add as caveat text moved into typed result
fields, whose meaning travels in the output schema (`2747106d`): `layer.empty_result`,
`unclassified_ha`, `classified_ha`, `coverage.provisional`. The aim was to see whether the fields
work as well as the text they replaced.

Two changes to the method. The areas are the fixed 20 × 20 km boxes of the timing run, pasted as
GeoJSON, so figures can be compared across rounds from now on. Desktop was restarted on the code of
`f33df71a`. Answers were checked against `mcp/var/calls.jsonl`, round 3 starting at line 24.

Status: round finished.

## Conclusions

| Fact | Round 2, as caveat text | Round 3, as a field | Verdict |
|---|---|---|---|
| Empty result means nothing mapped here | Relayed (Q5) | Relayed (Q2) | Field works as well as the text |
| Unclassified hectares are not a class | Repeated, then a guess (Q3, Q9) | A guess dressed as source knowledge (Q1); no guess (Q3); a cross-layer comparison (Q4) | Mixed, no worse than the text |
| The module boundary is provisional | Softened (Q2), dropped for "part is in Peru" (Q6) | Read as "the layer is provisional", twice (Q1, Q3) | Worse: the field is misread |
| Carbon is a mean density, total not computed (CMS caveat, unchanged) | Relayed (Q9) | Not relayed (Q4) | Regression, same text |

**The empty-result field is enough.** The model said coverage is missing, not that there are zero
hectares, and did not suggest a fault.

**`coverage.provisional` is misread.** Both times the model reported it, it attached it to the
layer ("la capa es provisional", "la capa está marcada como cobertura provisional"), although the
field's description says the module boundary is a bounding box. The warning that matters near the
border, that the area may fall partly outside the module, never reached the user. The name does not
say what is provisional, and `coverage` sits next to `layer` in the response. *Done after the
round:* the flag became `coverage.boundary: "bounding_box"`, whose description says it is about the
module boundary and not the layer, and the description of `status` repeats that `inside` does not
rule out an area partly outside. Not yet retested.

**The Peru claim did not come back** (Q3). Nor did a guess about unclassified land on that question.
With one run each, this is as likely to be variance as the effect of a field.

**A caveat in the result is not always relayed.** The Carbon caveat is the same text, in the same
result, for the same question as Q9 of rounds 1 and 2, where it was relayed both times. Here it
was left out. With one run per round there is no telling why. A caveat that has to reach the user
every time is a case for showing it outside the model's text, the lever recommended in the spec
("Steering the model's wording").

**Times match the timing run.** Every call within half a second of that run's median for the same
layer and area: 3.43 against 3.00 s, 0.39 against 0.19 s, 1.90 against 1.68 s, 5.46 against
5.20 s. The difference is probably the MCP transport and the first connection, not measured apart.

## Calls

| # | Question | Tool, indicator | Result | Time | Vertices received | Round 2 time |
|---|---|---|---|---|---|---|
| 1 | Hectares of each ecosystem, Puyo box | `area_by_category`, 210 | 3 classes, 11,816 of 39,780 ha (30 %) | 3.43 s (2.95 in ArcGIS) | 76,071 | 4.08 s |
| 2 | Hectares of each flooding regime, same area | `area_by_category`, 214 | empty, `not_mapped_here` | 0.39 s | 0 | 0.55 s |
| 3 | Hectares of each flooding regime, Nuevo Rocafuerte box | `area_by_category`, 214 | 3 classes, 24,204 of 39,788 ha (61 %) | 1.90 s (1.84 in ArcGIS) | 10,659 | 3.04 s |
| 4 | Hectares of each forest stratum, Puyo box | `area_by_category`, 206 | 2 strata, 11,766 of 39,780 ha (30 %) | 5.46 s (3.29 in ArcGIS) | 333,834 | 5.09 s |

Round 2 times are over larger boxes Desktop drew itself, so they compare in order of magnitude only.

## Findings

- **Q1.** Classified and unclassified hectares given separately, with the share, and no invented
  total. Then: "in the Ecosystem Map of Ecuador (2012) that usually corresponds to intervened
  areas (agriculture, urban, etc.), not a data gap". The guess of round 2 ("pasture, crops or the
  town") now presented as knowledge of the source, and "not a data gap" is a claim the MCP did not
  make. The layer description says areas without a polygon are not a category. Then the misreading
  of `coverage.provisional` as a property of the layer.

- **Q2, as intended.** Area reused from Q1. "The layer is not mapped in this zone… coverage is
  missing, not 0 ha floodable." It quoted the value `not_mapped_here` literally, which a front end
  should not show a user. It mentioned again the 342 ha of floodable forest in Ecosystems, a
  reference to another indicator rather than a combination, as in round 2.

- **Q3.** Three classes and 15,584 ha "without a class in this layer", with nothing guessed about
  them. The interpretation note carried ("floodability describes vegetation, not flood risk").
  No claim about Peru. The boundary warning again became "the layer is provisional".

- **Q4.** Two strata and 28,014 ha "without a stratum, in line with the unclassified part of the
  ecosystems layer". Milder than round 2's "the rest would be non-forest", still a relation drawn
  between two products (11,766 against 11,816 ha classified). Nothing multiplied, and the Carbon
  caveat left out.

## What each question checks

| # | Round 2 question | Round 2 finding | What should hold with fields |
|---|---|---|---|
| 1 | Q3 | Unclassified stated as not a class, then a guess | No guess about unclassified hectares |
| 2 | Q5 | Fixed by the empty-result caveat | Same meaning from `layer.empty_result` |
| 3 | Q6 | Boundary caveat dropped for "part is in Peru" | Boundary relayed as provisional; no Peru claim |
| 4 | Q9 | Carbon caveat respected; "the rest would be non-forest" | Caveat relayed; no cross-layer conclusion |
