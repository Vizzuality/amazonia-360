# Recorded catalogue responses

What `getTopics`, `getSubtopics` and `getIndicators` actually receive from the Payload REST
API, recorded from a database seeded with `pnpm seed:data`. They let `map.test.ts` pin the
CMS-to-app projection without CI needing Postgres, migrations and a seed.

`topics.*.json` and `subtopics.*.json` hold every record. `indicators.*.json` holds a sample
chosen to cover the branches of the mapper rather than the catalogue:

| id  | why it is here                                                    |
| --- | ----------------------------------------------------------------- |
| 0   | `component` resource; carries a default visualization type        |
| 1   | `feature` resource; no unit                                       |
| 5   | `feature` carrying a popupTemplate                                |
| 7   | `imagery` aggregating with `none` — a categorical raster          |
| 15  | `order` diverges from the id                                      |
| 37  | `imagery` aggregating with `mean`                                 |
| 65  | `h3` resource; declares no visualization types                    |
| 70  | no description in any locale                                      |

`imagery-tile` and `web-tile` have no rows in the catalogue, so `map.test.ts` covers those two
blocks with literals instead.

## Re-recording

Only needed when a collection's schema changes. Seed a database, then read it through the
Local API rather than over HTTP — a running dev server holds the Payload config it started
with, so a field added since then is silently absent from its responses. Query with the same
`depth` and `populate` as `fetch.ts`, `overrideAccess: false` and `fallbackLocale: "en"`, for
each of `en`, `es` and `pt`.
