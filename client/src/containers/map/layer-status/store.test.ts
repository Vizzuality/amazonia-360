import { getExploreLayerStatus } from "@/containers/map/layer-status/store";

describe("getExploreLayerStatus", () => {
  it.each([
    { status: "loading", isEmptyInView: false, expected: "loading" },
    { status: "error", isEmptyInView: false, expected: "unavailable" },
    { status: "success", isEmptyInView: false, expected: "ok" },
    { status: "success", isEmptyInView: true, expected: "no_coverage" },
    // A layer that will not draw at this scale is not a layer without data.
    { status: "empty", isEmptyInView: false, expected: "ok" },
  ] as const)("is $expected for a $status layer (empty in view: $isEmptyInView)", (row) => {
    expect(getExploreLayerStatus(row.status, row.isEmptyInView)).toBe(row.expected);
  });
});
