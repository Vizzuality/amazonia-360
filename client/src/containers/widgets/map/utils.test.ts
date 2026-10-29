import { getMapWidgetStatus } from "@/containers/widgets/map/utils";

describe("getMapWidgetStatus", () => {
  it.each([
    {
      mapStatus: "loading",
      isFeature: true,
      count: undefined,
      isCountError: false,
      expected: "loading",
    },
    { mapStatus: "ready", isFeature: true, count: 3, isCountError: false, expected: "ok" },
    { mapStatus: "ready", isFeature: true, count: 0, isCountError: false, expected: "no_coverage" },
    {
      mapStatus: "loading",
      isFeature: true,
      count: 0,
      isCountError: false,
      expected: "no_coverage",
    },
    { mapStatus: "ready", isFeature: false, count: undefined, isCountError: false, expected: "ok" },
    { mapStatus: "error", isFeature: true, count: 0, isCountError: false, expected: "unavailable" },
    {
      mapStatus: "ready",
      isFeature: true,
      count: undefined,
      isCountError: true,
      expected: "unavailable",
    },
  ] as const)(
    "is $expected for a $mapStatus map (feature: $isFeature, count: $count, count failed: $isCountError)",
    ({ expected, ...input }) => {
      expect(getMapWidgetStatus(input)).toBe(expected);
    },
  );
});
