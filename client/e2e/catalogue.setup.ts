import { test as gate, expect } from "@playwright/test";

import INDICATORS_ECU from "../datum/indicators.ECU.json" with { type: "json" };
import INDICATORS from "../datum/indicators.json" with { type: "json" };
import SUBTOPICS from "../datum/subtopics.json" with { type: "json" };
import TOPICS from "../datum/topics.json" with { type: "json" };

/**
 * Every other project depends on this one. Seeding has exited 0 without writing a row, and
 * the webServer chain — `db:migrate && db:seed && build && start` — then builds and starts
 * happily on an empty database. The suite spends twelve minutes failing fifteen specs that
 * each read as a product bug. Failing here instead costs seconds and names the cause.
 *
 * `db:seed` makes the seeder prove it ran, so a silent no-op should not reach here. This
 * still earns its place by reading what the CMS serves rather than what the CLI printed:
 * it is the only check that also catches rows seeded in a state the app cannot see.
 *
 * Counted off `datum/*.json` rather than written down, so retiring a row is one edit.
 */
const CATALOGUE = [
  { collection: "topics", records: TOPICS.length },
  { collection: "subtopics", records: SUBTOPICS.length },
  { collection: "indicators", records: INDICATORS.length + INDICATORS_ECU.length },
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

    expect(docs.length).toBeLessThan(INDICATORS.length + INDICATORS_ECU.length);
    expect(hasNextPage).toBe(true);
  },
);
