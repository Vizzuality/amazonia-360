import { describe, expect, it } from "vitest";

import { LOCATION_TYPES, LocationType } from "@/constants/search";

import { getCountrySourceOverrides, getSources, SearchSourceProperties } from "./search-filters";

const geometry = { type: "polygon" } as __esri.GeometryUnion;

const SOURCES = Object.fromEntries(
  LOCATION_TYPES.map((type) => [type, { name: type, countryCode: "BRA,ECU" }]),
) as Record<LocationType, SearchSourceProperties>;

describe("getCountrySourceOverrides", () => {
  const overrides = getCountrySourceOverrides("ECU", geometry);

  it.each(["country", "state", "municipality"] as const)("filters %s by GID_0", (type) => {
    expect(overrides[type]).toEqual({ filter: { where: "GID_0 = 'ECU'" } });
  });

  it("filters capitals by ISO", () => {
    expect(overrides.capital).toEqual({ filter: { where: "ISO = 'ECU'" } });
  });

  it("restricts the geocoder to the country", () => {
    expect(overrides.city).toEqual({ countryCode: "ECU" });
  });

  it("filters indigenous territories by their pais name", () => {
    expect(overrides["indigenous-territory"]).toEqual({ filter: { where: "pais = 'Ecuador'" } });
  });

  it("filters protected areas by the country geometry", () => {
    expect(overrides["protected-area"]).toEqual({ filter: { geometry } });
  });

  it("uses the layer's own spelling of the country name", () => {
    expect(getCountrySourceOverrides("BRA", geometry)["indigenous-territory"]).toEqual({
      filter: { where: "pais = 'Brasil'" },
    });
  });

  it("returns no protected areas when the country geometry is missing", () => {
    expect(getCountrySourceOverrides("ECU", null)["protected-area"]).toEqual({
      filter: { where: "1 = 0" },
    });
  });
});

describe("getSources", () => {
  it("returns the sources untouched in LOCATION_TYPES order without overrides", () => {
    const sources = getSources(SOURCES);

    expect(sources.map(({ name }) => name)).toEqual([...LOCATION_TYPES]);
    sources.forEach((source) => {
      expect(source).toEqual({ name: source.name, countryCode: "BRA,ECU" });
    });
  });

  it("merges the overrides and keeps LOCATION_TYPES order", () => {
    const sources = getSources(SOURCES, getCountrySourceOverrides("ECU", geometry));

    expect(sources.map(({ name }) => name)).toEqual([...LOCATION_TYPES]);
    expect(sources[LOCATION_TYPES.indexOf("city")]).toEqual({ name: "city", countryCode: "ECU" });
    expect(sources[LOCATION_TYPES.indexOf("state")]).toEqual({
      name: "state",
      countryCode: "BRA,ECU",
      filter: { where: "GID_0 = 'ECU'" },
    });
  });
});
