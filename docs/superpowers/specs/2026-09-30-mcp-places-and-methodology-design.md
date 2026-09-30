# MCP places by name and methodology skill, phase 3

Phase 3 of the [MCP module](2026-09-24-mcp-module-design.md): the user names a province, a canton
or a protected area instead of pasting a GeoJSON polygon, and a skill tells the model the method
the server expects it to follow.

Proposed on 30 September 2026. Three ideas come from the consultant's prototype (AiMF360): a
gazetteer, area handles that keep polygons out of the model, and the method written as a skill.
Each is adapted to this server below; the handles are replaced by stateless place ids.

## Decisions

| # | Decision | Outcome |
|---|---|---|
| 1 | Areas by name | A tool `find_places` returns candidate places, each with an id. Every area tool accepts `place_id` as an alternative to `area` |
| 2 | Place ids | Stateless and derived from the place's name. No table and no stored handle |
| 3 | Boundary sources | The administrative layers the front end already uses (provinces and cantons) and the National System of Protected Areas (216) |
| 4 | Matching | Accent- and case-insensitive. Every match comes back; the server never picks one |
| 5 | Method | A skill `amazonia360`, installed by hand for the proof of concept. The server `instructions` stay short |

Parishes, free-text geocoding and user-drawn areas saved by name are out of scope.

### Why ids and not stored handles

A handle is worth having because the polygon stays out of the model's context. For a named place
an id does that with no state: the server fetches the boundary when a tool uses the id. For a
polygon the user drew, the model already holds the GeoJSON, so a handle saves nothing.

Ids need no table and no expiry. They work the same over stdio, which has no database. They also
need no binding to a user, since the boundaries are public. A handle stored in the `mcp` schema
would need all three.

## Boundary data

Checked against the live services on 30 September 2026:

| Kind | Layer | Name field | In Ecuador | Vertices |
|---|---|---|---|---|
| `province` | `Political_administrative_division_of_order_1/FeatureServer/4` | `NAME_1` | 16 | 244 to 320 for the Amazonian provinces sampled |
| `canton` | `Political_administrative_division_of_order_2/FeatureServer/6` | `NAME_2`, with `NAME_1` | 95 | 185 for Tena |
| `protected_area` | layer 216 of the Ecuador module | `Nombre`, with `Categoria` | 40 | 23,369 for Yasuní |

Filtered with `GID_0 = 'ECU'`. The administrative layers hold whole units that touch the
region, so Andean ones are included: the canton of Quito comes at its full 4,244 km². The
existing `coverage` field already says how much of an area falls outside the module, so no filter
is added.

The names have defects:
- "Mejía" appears under both Pastaza and Pichincha;
- Cotopaxi has "Saquisili" and "Saquisilí" as two cantons;
- the province "Bolivar" has no accent.

Some names are ambiguous by nature, for example Bolívar (a province, and a canton in Carchi),
Pastaza, Sucumbíos, Orellana and Zamora (each both a province and a canton). All of this is why
`find_places` returns every match with its kind and its province.

## Tools

### `find_places`

Input: `query` (string), and optional `kind` (`province`, `canton`, `protected_area`).

Output: the matches, each with:
- `id`;
- `name`;
- `kind`;
- `province` (for a canton);
- `category` (for a protected area);
- `area_ha`;
- `bbox`.

It matches the whole normalised name first. If nothing matches, it looks for the query as a whole
word inside the name, so "Sumaco" finds "Sumaco Napo-Galeras". With no match, it returns an empty
list and a note that names the three kinds covered.

The candidate list comes from a snapshot written by the catalogue sync
(`catalogue/places.snapshot.json`: ids, names, kinds, areas, bboxes; no geometry). That keeps
`find_places` offline and fast. The geometry is fetched from ArcGIS when an area tool uses the id,
and kept in an in-process cache for 24 hours.

### Place ids

`province:<NAME_1>`, `canton:<NAME_1>/<NAME_2>` and `protected_area:<Nombre>`, for example
`canton:Napo/Tena`. They carry names rather than `FID`s, because an `FID` can change when a layer
is republished. An id that no longer matches the snapshot fails with a message that says to call
`find_places` again.

### Area tools

`categories_in_area`, `count_in_area`, `area_by_category`, `class_shares_in_area` and the two map
tools take exactly one of `area` and `place_id`. With `place_id`:

- the response gains `place` (`id`, `name`, `kind`, source layer), next to `computed_over` and
  `coverage`;
- the client's 5,000-vertex input limit does not apply. The limit exists to stop a client sending
  a province at full resolution, and a place does not travel through the request. The clip time on
  the largest protected areas is measured before this is settled (open question 1);
- the map tools put the place's geometry in the result's `_meta`, because the tool input no longer
  holds it. The pages read the area from `_meta` when the input has none.

## Methodology skill

The method is a skill, `mcp/skills/amazonia360/SKILL.md`. Its description tells the client when
to load it: questions about the physical and natural environment of the Ecuador module. The body
covers:

- the call order: `find_places` or a polygon, then `list_indicators`, then the fast tools, then the
  area tools;
- what to do with several candidate places: ask;
- figures from different indicators are not combined;
- caveats are quoted unchanged;
- the rules for maps.

It also covers ambiguous terms. "Biodiversity", for example, could be answered by ecosystems (210),
biogeographic units (219) or the flooding regime (214). The model names the candidates, says how
they differ, and picks the one that matches the intent, or asks.

For this proof of concept the skill is installed by hand: uploaded as a zip in Claude Desktop and
claude.ai, or copied into `.claude/skills/` in Claude Code. A plugin that bundles the skill with
the server is left for later.

The server `instructions` keep what every client needs, including clients without skills. In the
Desktop trials, rules that lived only in `instructions` had no visible effect. A skill is loaded
into the conversation as instructions the model reads when the task matches, which may hold
better. Whether it does is measured (Testing).

## Testing

- `find_places`:
  - "Tena" returns one canton;
  - "Pastaza" returns a province and a canton;
  - "Mejía" returns two cantons in two provinces;
  - "yasuni" matches "Yasuní";
  - "Sumaco" matches by whole word;
  - an unknown name returns an empty list with the note.
- Place ids: a canton id resolves to the same hectares as its polygon sent as `area`; an id not in
  the snapshot fails with its message; `area` and `place_id` together are refused.
- The sync writes the places snapshot; without network it leaves the previous one in place, as the
  catalogue snapshot does.
- The map pages draw an area taken from `_meta`.
- A Desktop round with the demo questions rewritten by place name, run once with the skill and
  once without it, to see whether the skill changes the wording.

## Open questions

1. The clip time over large protected areas at full resolution (Yasuní, 23,369 vertices). If it is
   too slow, the server generalises the boundary and `computed_over` says by how much.
2. Official boundaries. The administrative layers come from the regional platform and have the
   name defects listed above. The consultant could supply the official ones (INEC or CONALI),
   parishes included. Until then, the defects could go to Jira with the `data-quality` label.
