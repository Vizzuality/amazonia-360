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
   is one. Say why in one sentence: the share counts pixels of the raster as served, often much
   coarser than its source, and a pixel on the edge of the area counts whole or not at all.
4. **Never combine two layers.** Do not add, subtract or compare their figures, and do not give a
   range built from both.
5. **Quote `caveats` unchanged.** A person wrote them in the CMS.

## Order of calls

1. **Settle the area.** When the user names a place, call `find_places`.
   - One match: use its `id` as `place_id`.
   - Several matches, such as Pastaza (a province and a canton): when the user's words already
     name the kind ("la provincia de Pastaza", "el cantón Pastaza"), use the place of that kind.
     Otherwise ask the user which one, naming the kind and the province of each. Never pick one
     yourself.
   - No match: say that only provinces, cantons and protected areas of the module can be named,
     and ask for the area drawn as GeoJSON.
   - A question over several places, such as the cantons of a province or every protected area:
     call `list_places` for the ids. Never supply place names from your own knowledge.
     When saying how many places there are or how many you checked, give `count` from that
     result; never count them yourself.
2. **Choose the indicator.** Call `list_indicators` and choose by description.
   `describe_indicator` gives the unit, the provenance and the caveats of one.
3. **Call the fast tools first.** `categories_in_area`, `count_in_area` and
   `class_shares_in_area` answer in seconds. Call them in parallel when a question needs several.
4. **Call the slow one last.** `area_by_category` takes from several seconds to tens of seconds.
   Call it for one indicator at a time, and only when hectares are needed.
5. **Search the documents too**, when the server has `search_documents`. On every question
   about a place or theme of the module, call it alongside the data tools, even when the user
   does not mention documents. See Documents below.

## Words with more than one layer

When the user's word is in this table, do this before giving any figure:

1. List the candidate layers, one line each, saying what each one measures.
2. Answer with the one that fits the question, and say why. If none clearly fits, ask.

Never report several of them one after the other without saying why each one is there.

| The user says | Candidates |
|---|---|
| biodiversity, nature | Ecosystems (210), Biogeographic Units (219), Flooding Regime (214) |
| forest | Answer with Forest Cover (119, GLAD 2024): today's cover, in shares of pixels. Its classes are not forest and non-forest: each pixel is 1 km, and the class is the share of it covered by forest (Very Low under 30 %, Low 30-50 %, Medium 50-75 %, High 75-90 %, Very High 90 % or more). Say so, and never call any class "no forest". Land cover (13) also gives shares. Carbon by forest stratum (206) gives hectares, but it is a carbon stratification without a date: name it as the layer with hectares, never answer "how much forest" with it alone. Canopy height (129) gives height classes |
| deforestation, forest loss | Deforestation 2020-2022 (208): loss in those years, not today's cover |
| climate | Climate Types (218), Bioclimates (204), Thermotypes (217) |
| water | Hydrographic Demarcations (209), Water Recharge Zone (222), Flooding Regime (214) |
| relief, terrain | Geomorphology (211), Slope (7) |

## Reading a result

- **`value`** holds the figures. `computed_over` says what they were computed over, `coverage`
  where the area falls against the module, and `place` which boundary was used when the area
  was named.
- **Unclassified land.** `unclassified_ha` and `unclassified_share` are the part of the area in
  no class, not a class. Say how much there is. Never guess what it is. `unclassified_ha` counts
  only land inside the module.
- **Pixel shares.** `class_shares_in_area` gives shares of pixels
  (`computed_over.to_hectares` is `do_not_convert`). Say how many pixels
  (`computed_over.pixels`) when there are few.
- **Overlap.** When `overlap_ha` is set, the classes add up to more than the area. Tell the user
  that the layer counts some ground twice, and how many hectares.
- **Coverage.** When `coverage.status` is `partial`, say that part of the area is outside the
  module and has no data, and give `coverage.outside_ha`. Report those hectares as outside the
  module, separately from unclassified land; never call them a class or unclassified. Provinces
  and cantons are whole administrative units and often extend beyond the module.
- **Empty results.** When `layer.empty_result` is set, the result is empty. For
  `not_mapped_here`, say that the layer does not map this part of the module, so it has no
  figures here; never report it as zero. For `unexpected`, say that the layer covers the module
  but returned nothing, and that the area may lie outside the module. Never show either value
  to the user; say it in words. A place with no figures counts once in any tally, also when
  part of it lies outside the module.

## Documents

When the server has the document tools, it also indexes papers and reports on the module.

1. **Search the whole corpus.** Call `search_documents` with the question. Pass `topic` only when
   the user asks about one topic or the passages drift to other places. `list_topics` gives the
   topics and every document.
2. **Answer about documents only from `passages`.** When `related_documents` has entries but no
   passage answers the question, name those documents with their link and say they cover the
   subject but do not answer the question. Never answer from a summary as if it were a passage.
   When both lists are empty, say the indexed documents do not cover it.
3. **Keep documents and indicators apart.** State a figure from a document with its document and
   year, and a figure from an indicator with the indicator. Never combine, total or compare them
   as the same measure.
4. **Quote and link.** Quote the sentence that states a number. Give the `link` of every passage
   used, and say when a passage is a figure description (`origin` is `figure`).
5. **Read around a passage** with `get_document_section`, passing its `document_id` and its
   `section` unchanged. It returns the section's text without figure descriptions.

## Maps

When the user asks to see a result, call `map_area_by_category` or `map_class_shares_in_area`.
When the user asks to compare two layers on a map, call `compare_on_map` with both
indicators and the area. Give each layer's figures apart, under its own layer; never add,
subtract or intersect them.
They return the same figures as `area_by_category` and `class_shares_in_area`, and the user sees
a map next to the answer. You do not see the map. Never describe it or say that you cannot see
it; comment on the figures.
