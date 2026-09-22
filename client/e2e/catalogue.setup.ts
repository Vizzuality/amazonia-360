import { test as gate, expect } from "@playwright/test";

import INDICATORS from "../datum/indicators.json" with { type: "json" };
import SUBTOPICS from "../datum/subtopics.json" with { type: "json" };
import TOPICS from "../datum/topics.json" with { type: "json" };

/**
 * Every other project depends on this one. `pnpm seed:data` has exited 0 without writing a
 * row, and the webServer chain — `migrate && seed:data && build && start` — then builds and
 * starts happily on an empty database. The suite spends twelve minutes failing fifteen specs
 * that each read as a product bug. Failing here instead costs seconds and names the cause.
 *
 * Counted off `datum/*.json` rather than written down, so retiring a row is one edit.
 */
const CATALOGUE = [
  { collection: "topics", records: TOPICS.length },
  { collection: "subtopics", records: SUBTOPICS.length },
  { collection: "indicators", records: INDICATORS.length },
] as const;

gate("the catalogue the CMS serves is seeded and complete", async ({ request }) => {
  for (const { collection, records } of CATALOGUE) {
    const response = await request.get(
      `/v1/api/${collection}?locale=en&fallback-locale=en&depth=0&pagination=false`,
    );

    expect(
      response.ok(),
      `GET /v1/api/${collection} answered ${response.status()}: the migrations may not have run`,
    ).toBe(true);

    // `totalDocs` is counted after access control filters drafts out, so an unpublished
    // record reports 163 of 163. Only the length of `docs` sees the difference.
    expect(
      (await response.json()).docs,
      `${collection} came back short: the database is empty or half seeded, not a product bug`,
    ).toHaveLength(records);
  }
});

gate(
  "the catalogue is capped without `pagination=false`, which is why every read passes it",
  async ({ request }) => {
    const response = await request.get("/v1/api/indicators?locale=en&depth=0");
    const { docs, hasNextPage } = await response.json();

    expect(docs.length).toBeLessThan(INDICATORS.length);
    expect(hasNextPage).toBe(true);
  },
);
