# MCP trial from Claude Desktop, round 4, 30 September 2026

The first round of [phase 3](../specs/2026-09-30-mcp-places-and-methodology-design.md): areas are
named instead of drawn (`find_places`, `place_id`), and the method ships as the `amazonia360`
skill. Nine questions were asked without the skill. Three of them were asked again with it, and
Q9 once more without it.

Desktop was restarted on `12567d6e`, with a new conversation per question and the question pasted
alone. Times come from `mcp/var/calls.jsonl`, between 15:19 and 15:40 UTC. `find_places` is not
written to the call log.

Status: round finished.

## Conclusions

**Places by name work in every case tried:**
- a canton (Tena);
- a protected area, named alone and with its category ("Parque Nacional Yasuní");
- a province that reaches beyond the module (Loja);
- two ambiguous names (Zamora, Mejía), where the model always asked which one;
- a name that is not covered (Guayaquil).

Loja, Zamora and the category prefix work because of fixes made after the final code review. Before
them, Loja was refused as "beyond the module", "Zamora" returned only the canton, and "Parque
Nacional Yasuní" returned nothing.

**The model asks rather than picks.** For Zamora and Mejía it offered the candidates with their
province and area, in Desktop's choice widget. With the skill and without it, the behaviour was the
same.

**Both maps draw from a place id.** The page takes the area from the result, and the boundary of
Yasuní (23,369 vertices) drew with no visible delay. The ecosystem map shows class outlines but no
fill, although the legend has colours. This is the layer's renderer, which fills at 2/255 opacity
(AM-729). The page copies it, so the legend promises colours the map does not show.

**The skill loads and changes two things.** "Read amazonia360 skill" appears before the first tool
call, and the calls follow its order. The measurable difference is Q9:

| | Without the skill | With the skill |
|---|---|---|
| Pixel shares turned into hectares | Yes: "unas 337.000 ha", 86.4 % of pixels applied to the canton | No: "esta capa no da superficie" |
| Other forest layers named | No | Yes, with a note that they measure different things |

**The ambiguity guidance does not work as written.** It is phrased as a description ("When the
user's word matches more than one indicator, name the candidates…"). With "biodiversidad" (Q8) the
model reported two layers one after the other, without saying why or how they differ. With "bosque"
(Q9) it named the alternatives only after the figures. "Tipos de clima" (Q3) matches the name of
Climate Types, so it was a poor test of ambiguity. The skill will be rewritten with its rules in the
imperative.

**Rules in the result reach the user more reliably than rules in text.** This has held in every
round. The pixel rule reached the user only with the skill loaded. A client without the skill will
convert shares to hectares, so the rule also belongs in the `class_shares_in_area` result.

**One figure did not come from a tool.** In Q8 without the skill, the answer says Tena has 16
ecosystems, but the only call in that conversation was to layer 219. The number matches Q1 of the
same session, so it most likely came from Desktop's memory of earlier chats. It is correct, but the
model presented it as a result.

**The hectare figures of the round were too high wherever a feature has holes (AM-734).** In Q8 the model noticed that the
219 units add up to more than the canton, and guessed the cause was overlapping polygons. The cause
was the server. It read features from ArcGIS as GeoJSON, and ArcGIS Online's GeoJSON output drops
holes: each ring comes back as its own polygon, so a hole is filled and the ground under it is
counted twice. Twelve of the 13 feature layers have features with holes. Read as Esri JSON, with
holes taken from ring orientation, the classes over Tena add up to the canton or less:

| Layer | Read as GeoJSON | Read as Esri JSON |
|---|---|---|
| 219 Biogeographic Units | 392,504 ha | 390,349 ha |
| 210 Ecosystems | 320,675 ha | 310,256 ha |
| 211 Geomorphology | 396,217 ha | 390,329 ha |
| 217 Thermotypes | 402,173 ha | 390,354 ha |
| 218 Climate Types | 392,140 ha | 390,351 ha |

The figures in this report are those the model received, before the fix (`b7fcdeca`). For Q1, the
unclassified part of Tena is 80,099 ha, not 69,680. The server did not flag the excess, and
reported `unclassified_ha: 0`; it now sets `overlap_ha` when classes add up to more than the area.
Place boundaries were not affected, because they were already repaired with a method that turns
nested rings back into holes.

**Times are those of drawn areas of the same size.** Fetching the boundary adds 0.4 to 0.5 s on
first use and nothing after. `area_by_category` over the full Yasuní boundary took 6.7 s (208);
the Yasuní raster map took 9.1 s. The first call to the regional land-cover raster took 19.6 s cold
and 0.5 s warm, which matches the demo note about warming the IDB image service.

## Calls

| # | Question | Skill | Tool, indicator, place | Result | Time |
|---|---|---|---|---|---|
| 1 | Muéstrame en un mapa los ecosistemas del cantón Tena | No | `map_area_by_category`, 210, `canton:Napo/Tena` | 16 classes, 69,680 of 390,354 ha unclassified | 13.3 s (place 0.46) |
| 2 | ¿Qué cobertura forestal hay en el Yasuní? Muéstramela en un mapa | No | `map_class_shares_in_area`, 119, `protected_area:Yasuní` | 96.7 % of 10,362 pixels "Very High" | 9.1 s (place 1.22) |
| 3 | ¿Qué tipos de clima hay en Zamora? | No | `area_by_category`, 218, `province:Zamora Chinchipe` (after asking) | 3 classes, 4,000 ha unclassified | 0.96 s |
| 4 | ¿Qué ecosistemas hay en la provincia de Loja? | No | `area_by_category`, 210, `province:Loja` | 9 classes over 22,400 ha, 2 % of the province | 5.6 s |
| 5 | ¿Cuánta deforestación hubo en el Parque Nacional Yasuní? | No | `area_by_category`, 208, `protected_area:Yasuní` | 472 ha in three transitions | 6.7 s |
| 6 | ¿Qué ecosistemas hay en Guayaquil? | No | `find_places` only | No match | |
| 7 | ¿Hay áreas en restauración en Mejía? | No | `count_in_area`, 202, `canton:Pastaza/Mejía` (after asking) | 8 features | 0.73 s |
| 8 | ¿Cómo es la biodiversidad del cantón Tena? | No | `area_by_category`, 219, `canton:Napo/Tena` | 5 units, 392,504 ha over 390,354 | 4.5 s |
| 8 | same | Yes | `area_by_category`, 210; `categories_in_area`, 219 | 16 ecosystems with shares; the units listed | 12.3 s, 0.55 s |
| 3 | same | Yes | `area_by_category`, 218, `province:Zamora Chinchipe` | Same figures as without the skill | 1.06 s |
| 9 | ¿Cuánto bosque hay en el cantón Tena? | Yes | `class_shares_in_area`, 13, `canton:Napo/Tena` | 86.4 % of 62,902 pixels tree cover | 19.6 s (cold) |
| 9 | same | No | `class_shares_in_area`, 13, `canton:Napo/Tena` | Same shares, then "unas 337.000 ha" | 0.54 s |

## Answers

**Q1.** The map drew the canton and its classes, with the legend and the note on unclassified
land. The answer quoted the three largest classes and the 18 % without a class, with no guess at
what it is. One class, "Bosque siempreverde del páramo", shows as 0 ha in the legend: it touches
the canton with less than half a hectare. The model counted it among the 16 ecosystems.

**Q2.** `find_places` found the park and the raster map drew it, with the outside dimmed. The answer
named GLAD 2024 (from the layer's description in the catalogue), gave the shares and said they are
shares of 1 km cells, not hectares of forest. The legend shows "Low 0 %".

**Q3.** Both times the model asked which Zamora was meant, then answered with Climate Types (218)
without naming the layer or its alternatives (Bioclimates, 204; Thermotypes, 217). The shares it
computed from the hectares are correct.

**Q4.** "Provincia de Loja" found the province. The answer said the layer covers only the Amazonian
module, that 2 % of the province has data, and that the rest has no information in this source. It
added, from the model's own knowledge, that the rest is the dry western Andes.

**Q5.** "Parque Nacional Yasuní" found the park. The answer gave 472 ha for 2020–2022, about 0.05 %
of the park, and said it is gross deforestation (from the layer's description).

**Q6.** The model said Guayaquil is on the coast, that the data covers only the Amazonian module,
and that a polygon of the city would return no classes either. It did not ask for GeoJSON.

**Q7.** The model asked which Mejía was meant, then gave 8 restoration actions and said the layer
only counts them. "Inventario oficial" is its own wording. The Mejía listed under Pastaza is one of
the name defects of the administrative layer noted in the spec.

**Q8, without the skill.** The model said there are no species data, and described the diversity of
habitats. It reported the 219 units with hectares and shares, said nothing explains "No Aplicable",
and noticed that the sum exceeds the canton, "probably because of overlapping polygons".

**Q8, with the skill.** Ecosystems with hectares and shares, the unclassified 17.9 % with no guess,
the 2012 date of the ecosystem map, and the 219 units named, with "No Aplicable" flagged as odd.
Nothing said why these two layers, or how they differ.

**Q9, with the skill.** Land cover (13), 86.4 % of pixels tree cover. The answer said it is a share
of pixels and not hectares, and named GLAD forest cover, carbon by forest stratum and canopy height
as other forest layers that measure different things.

**Q9, without the skill.** The same shares, then about 337,000 ha of tree cover, obtained by applying
the share to the canton's area and presented as an estimate. A line of the model's reasoning ("Need
indicator list.") leaked into the start of the answer.

## Changes

Agreed after the round:
1. The server reads features as Esri JSON, so holes stay holes (done, `b7fcdeca`).
2. `class_shares_in_area` states in its result that shares are not hectares and must not be
   converted.
3. A result says so explicitly when the classified hectares exceed the area (`overlap_ha`).
4. Map legends show "< 1 ha" and "< 0.1 %" instead of 0.
5. The ecosystem map fills classes with their legend colour instead of the renderer's opacity.
6. The skill's rules are rewritten in the imperative, and the model names the layer used and its
   alternatives before giving the figures.
