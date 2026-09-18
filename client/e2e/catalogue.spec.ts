import INDICATORS from "../datum/indicators.json" with { type: "json" };
import SUBTOPICS from "../datum/subtopics.json" with { type: "json" };
import TOPICS from "../datum/topics.json" with { type: "json" };
import { test, expect } from "./fixtures";

/**
 * The seed, the migrations, access control and the REST API together still deliver every record
 * the source catalogue holds. Counted off `datum/*.json` rather than written down, so retiring a
 * row is one edit.
 */
const CATALOGUE = [
  { collection: "topics", records: TOPICS.length },
  { collection: "subtopics", records: SUBTOPICS.length },
  { collection: "indicators", records: INDICATORS.length },
] as const;

test.describe("the catalogue the CMS serves", () => {
  for (const { collection, records } of CATALOGUE) {
    test(`delivers all ${records} ${collection}`, async ({ request }) => {
      const response = await request.get(
        `/v1/api/${collection}?locale=en&fallback-locale=en&depth=0&pagination=false`,
      );

      expect(response.ok()).toBe(true);
      // `totalDocs` is counted after access control filters drafts out, so an unpublished
      // record reports 163 of 163. Only the length of `docs` sees the difference.
      expect((await response.json()).docs).toHaveLength(records);
    });
  }

  test("is capped without `pagination=false`, which is why every read passes it", async ({
    request,
  }) => {
    const response = await request.get("/v1/api/indicators?locale=en&depth=0");
    const { docs, hasNextPage } = await response.json();

    expect(docs.length).toBeLessThan(INDICATORS.length);
    expect(hasNextPage).toBe(true);
  });
});
