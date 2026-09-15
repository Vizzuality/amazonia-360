import type { Option } from "payload";

import {
  allowedDefaultOptions,
  invalidDefaultMessage,
  isAllowedDefault,
} from "./default-visualization-type";

const OPTIONS: Option[] = [
  { label: "Map", value: "map" },
  { label: "Table", value: "table" },
  { label: "Chart", value: "chart" },
  { label: "Numeric", value: "numeric" },
];

describe("allowedDefaultOptions", () => {
  test("keeps only the options the indicator declares, in the field's own order", () => {
    expect(allowedDefaultOptions(OPTIONS, ["numeric", "map"])).toEqual([
      { label: "Map", value: "map" },
      { label: "Numeric", value: "numeric" },
    ]);
  });

  test("returns nothing when no type is declared, which is every h3 indicator", () => {
    expect(allowedDefaultOptions(OPTIONS, [])).toEqual([]);
  });

  test("ignores a declared type the field does not offer", () => {
    expect(allowedDefaultOptions(OPTIONS, ["ai", "custom"])).toEqual([]);
  });

  test("treats a missing or malformed sibling value as nothing declared", () => {
    expect(allowedDefaultOptions(OPTIONS, undefined)).toEqual([]);
    expect(allowedDefaultOptions(OPTIONS, "map")).toEqual([]);
    expect(allowedDefaultOptions(OPTIONS, [1, null])).toEqual([]);
  });

  test("accepts bare string options, which Payload allows alongside objects", () => {
    expect(allowedDefaultOptions(["map", "chart"], ["chart"])).toEqual(["chart"]);
  });
});

describe("isAllowedDefault", () => {
  test("is true only for a declared type", () => {
    expect(isAllowedDefault("map", OPTIONS, ["map", "chart"])).toBe(true);
    expect(isAllowedDefault("numeric", OPTIONS, ["map", "chart"])).toBe(false);
  });
});

describe("invalidDefaultMessage", () => {
  test("names the value that no longer fits", () => {
    expect(invalidDefaultMessage("chart")).toContain('"chart"');
  });
});
