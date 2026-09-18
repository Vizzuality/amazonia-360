import INDICATORS from "../datum/indicators.json" with { type: "json" };
import { test, expect } from "./fixtures";

// The record counts are asserted in `catalogue.setup.ts`, which gates the whole run.
test.describe("the catalogue the CMS serves", () => {
  test("is capped without `pagination=false`, which is why every read passes it", async ({
    request,
  }) => {
    const response = await request.get("/v1/api/indicators?locale=en&depth=0");
    const { docs, hasNextPage } = await response.json();

    expect(docs.length).toBeLessThan(INDICATORS.length);
    expect(hasNextPage).toBe(true);
  });
});
