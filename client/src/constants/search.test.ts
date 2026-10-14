import { describe, expect, it } from "vitest";

import { LOCATION_TYPES } from "./search";

describe("LOCATION_TYPES", () => {
  it("keeps the source order that saved search locations point at", () => {
    expect(LOCATION_TYPES).toEqual(["country", "state", "municipality", "capital", "city"]);
  });
});
