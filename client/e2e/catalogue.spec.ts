import { test, expect } from "./fixtures";

/**
 * The end-to-end half of the catalogue baseline: the seed, the migrations, access control and
 * the REST API together still deliver every record. The unit tests cover the other half — that
 * `datum/*.json` still holds these counts, and that every read asks for `pagination: false`.
 *
 * Nothing checks this at read time in the running app: a count compiled into the client
 * would turn an editor retiring an indicator into an empty catalogue for every user.
 */
const CATALOGUE = [
  { collection: "topics", records: 9 },
  { collection: "subtopics", records: 28 },
  { collection: "indicators", records: 164 },
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

    expect(docs.length).toBeLessThan(164);
    expect(hasNextPage).toBe(true);
  });
});
