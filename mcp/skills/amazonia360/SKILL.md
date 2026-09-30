---
name: amazonia360
description: Use when answering questions about the physical and natural environment of the Ecuador module of Amazonia 360 (ecosystems, land and forest cover, deforestation, climate, relief, water) over a province, canton, protected area or drawn area, with the amazonia360 MCP server connected.
---

# Amazonia 360, Ecuador module

The amazonia360 MCP server answers over an area of the Ecuador module: a province, a canton, a
protected area, or a polygon the user draws.

## Rules

Follow these on every answer.

1. **Take every figure from a tool result in this conversation.** Never estimate one, never
   build one from two results, and never reuse a figure from an earlier conversation.
2. **Name the layer before the figures.** Start the answer with the layer the figures come from,
   and its date when its description gives one.
3. **Never turn a share of pixels into hectares**, not even as an estimate. When the user wants
   hectares and the layer gives shares, say so, and name the layer that gives hectares if there
   is one.
4. **Never combine two layers.** Do not add, subtract or compare their figures, and do not give a
   range built from both.
5. **Quote `caveats` unchanged.** A person wrote them in the CMS.

## Order of calls

1. **Settle the area.** When the user names a place, call `find_places`.
   - One match: use its `id` as `place_id`.
   - Several matches, such as Pastaza (a province and a canton): ask the user which one, naming
     the kind and the province of each. Never pick one yourself.
   - No match: say that only provinces, cantons and protected areas of the module can be named,
     and ask for the area drawn as GeoJSON.
2. **Choose the indicator.** Call `list_indicators` and choose by description.
   `describe_indicator` gives the unit, the provenance and the caveats of one.
3. **Call the fast tools first.** `categories_in_area`, `count_in_area` and
   `class_shares_in_area` answer in seconds. Call them in parallel when a question needs several.
4. **Call the slow one last.** `area_by_category` takes from several seconds to tens of seconds.
   Call it for one indicator at a time, and only when hectares are needed.

## Words with more than one layer

When the user's word is in this table, do this before giving any figure:

1. List the candidate layers, one line each, saying what each one measures.
2. Answer with the one that fits the question, and say why. If none clearly fits, ask.

Never report several of them one after the other without saying why each one is there.

| The user says | Candidates |
|---|---|
| biodiversity, nature | Ecosystems (210), Biogeographic Units (219), Flooding Regime (214) |
| forest | Forest Cover (119) and Land cover (13) give shares of pixels; Carbon by forest stratum (206) gives hectares; Canopy height (129) gives height classes |
| deforestation, forest loss | Deforestation 2020-2022 (208): loss in those years, not today's cover |
| climate | Climate Types (218), Bioclimates (204), Thermotypes (217) |
| water | Hydrographic Demarcations (209), Water Recharge Zone (222), Flooding Regime (214) |
| relief, terrain | Geomorphology (211), Slope (7) |

## Reading a result

- **`value`** holds the figures. `computed_over` says what they were computed over, `coverage`
  where the area falls against the module, and `place` which boundary was used when the area
  was named.
- **Unclassified land.** `unclassified_ha` and `unclassified_share` are the part of the area in
  no class, not a class. Say how much there is. Never guess what it is.
- **Pixel shares.** `class_shares_in_area` gives shares of pixels
  (`computed_over.to_hectares` is `do_not_convert`). Say how many pixels
  (`computed_over.pixels`) when there are few.
- **Overlap.** When `overlap_ha` is set, the classes add up to more than the area. Tell the user
  that the layer counts some ground twice, and how many hectares.
- **Coverage.** When `coverage.status` is `partial`, say that part of the area is outside the
  module and has no data. Provinces and cantons are whole administrative units and can extend
  beyond the module even when `coverage` says `inside`, so a large unclassified part of a named
  unit is most likely outside the module, not a class.

## Maps

When the user asks to see a result, call `map_area_by_category` or `map_class_shares_in_area`.
They return the same figures as `area_by_category` and `class_shares_in_area`, and the user sees
a map next to the answer. You do not see the map. Never describe it or say that you cannot see
it; comment on the figures.
