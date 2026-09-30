---
name: amazonia360
description: Use when answering questions about the physical and natural environment of the Ecuador module of Amazonia 360 (ecosystems, land and forest cover, deforestation, climate, relief, water) over a province, canton, protected area or drawn area, with the amazonia360 MCP server connected.
---

# Amazonia 360, Ecuador module

The amazonia360 MCP server answers over an area of the Ecuador module: a province, a canton, a
protected area, or a polygon the user draws. Every figure comes from a tool result. Do not
estimate one, and do not build one from two results.

## Order of calls

1. **The area.** If the user names a place, call `find_places`. One match: use its `id` as
   `place_id`. Several matches, such as Pastaza (a province and a canton): ask the user which
   one, naming the kind and the province of each. No match: say that only provinces, cantons
   and protected areas can be named, and ask for the area drawn as GeoJSON.
2. **The indicators.** Call `list_indicators` and pick by description. `describe_indicator`
   gives the unit, the provenance and the caveats of one.
3. **The fast tools first.** `categories_in_area`, `count_in_area` and `class_shares_in_area`
   answer in seconds. Call them in parallel when a question needs several.
4. **The slow one last.** `area_by_category` takes from several seconds to a minute. Call it
   for one indicator at a time, and only when hectares are needed.

## Terms with more than one answer

When the user's word matches more than one indicator, name the candidates, say how they
differ, and pick the one that fits the question, or ask.

| The user says | Candidates |
|---|---|
| biodiversity, nature | Ecosystems (210), Biogeographic Units (219), Flooding Regime (214) |
| forest | Forest Cover (119), Land cover (13), Carbon by forest stratum (206), Canopy height (129) |
| deforestation, forest loss | Deforestation 2020-2022 (208): loss in those years, not today's cover |
| climate | Climate Types (218), Bioclimates (204), Thermotypes (217) |
| water | Hydrographic Demarcations (209), Water Recharge Zone (222), Flooding Regime (214) |
| relief, terrain | Geomorphology (211), Slope (7) |

## Reading a result

- **`value`** holds the figures. `computed_over` says what they were computed over, `coverage`
  where the area falls against the module, and `place` which boundary was used when the area
  was named.
- **Unclassified land.** `unclassified_ha` and `unclassified_share` are the part of the area in
  no class. They are not a class. Say how much there is, and do not guess what it is.
- **Pixel shares.** `class_shares_in_area` gives shares of pixels, not hectares. Say how many
  pixels (`computed_over.pixels`) when there are few.
- **Caveats.** `caveats` are known defects written by a person. Quote them unchanged.
- **Separate indicators.** Figures from two indicators describe two layers. Do not add them,
  subtract them or give a range built from both.
- **Coverage.** When `coverage.status` is `partial`, say that part of the area is outside the
  module and has no data. Provinces and cantons are whole administrative units and can extend
  beyond the module even when `coverage` says `inside`, so a large unclassified part of a named
  unit is most likely outside the module, not a class.

## Maps

When the user asks to see a result, call `map_area_by_category` or `map_class_shares_in_area`.
They return the same figures as `area_by_category` and `class_shares_in_area`, and the user sees
a map next to the answer. You do not see the map. Do not describe it or say you cannot see it;
comment on the figures.
