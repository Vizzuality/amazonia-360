import { getCountryModuleBoundaryIndex } from "./index";

describe("getCountryModuleBoundaryIndex", () => {
  it("sits above every indicator layer", () => {
    expect(getCountryModuleBoundaryIndex({ indicatorsCount: 0 })).toBe(1);
    expect(getCountryModuleBoundaryIndex({ indicatorsCount: 4 })).toBe(5);
  });

  it("sits above the grid layer in grid mode", () => {
    expect(getCountryModuleBoundaryIndex({ gridEnabled: true, indicatorsCount: 4 })).toBe(1);
  });
});
