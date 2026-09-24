import { describe, expect, it } from "vitest";

import {
  canonicalCountryPathname,
  countryFromPathname,
  getCountryCodes,
  isSavedReportPathname,
  routedPathname,
  stripCountry,
  withCountry,
} from "./index";

const LOCALES = ["en", "es", "pt"] as const;

describe("countryFromPathname", () => {
  it("reads a live code", () => {
    expect(countryFromPathname("/en/ECU/reports/grid", LOCALES)).toBe("ECU");
  });

  it("reads the Amazon Region as no country at all", () => {
    expect(countryFromPathname("/en/reports/grid", LOCALES)).toBeNull();
    expect(countryFromPathname("/en", LOCALES)).toBeNull();
  });

  it("does not mistake a configured-but-unavailable country for a live one", () => {
    expect(countryFromPathname("/en/SUR/reports", LOCALES)).toBeNull();
  });

  it("reads a path that has not been given a locale yet", () => {
    expect(countryFromPathname("/ECU/reports", LOCALES)).toBe("ECU");
  });
});

describe("withCountry", () => {
  it("prefixes a scoped path", () => {
    expect(withCountry("/reports/grid", "ECU")).toBe("/ECU/reports/grid");
    expect(withCountry("/", "ECU")).toBe("/ECU");
  });

  it("leaves the path alone for the Amazon Region", () => {
    expect(withCountry("/reports/grid", null)).toBe("/reports/grid");
    expect(withCountry("/", null)).toBe("/");
  });

  it("leaves unscoped roots alone", () => {
    expect(withCountry("/auth/sign-in", "ECU")).toBe("/auth/sign-in");
    expect(withCountry("/private/my-reports", "ECU")).toBe("/private/my-reports");
  });

  it("is idempotent", () => {
    expect(withCountry(withCountry("/reports", "ECU"), "ECU")).toBe("/ECU/reports");
    expect(withCountry("/ECU/reports", "BOL")).toBe("/ECU/reports");
  });
});

describe("stripCountry", () => {
  it("removes a live code and nothing else", () => {
    expect(stripCountry("/ECU/reports/grid")).toBe("/reports/grid");
    expect(stripCountry("/reports/grid")).toBe("/reports/grid");
    expect(stripCountry("/SUR/reports")).toBe("/SUR/reports");
  });
});

describe("canonicalCountryPathname", () => {
  it("uppercases a lowercase live code", () => {
    expect(canonicalCountryPathname("/en/ecu/reports/grid", LOCALES)).toBe("/en/ECU/reports/grid");
  });

  it("leaves everything already canonical alone", () => {
    expect(canonicalCountryPathname("/en/ECU/reports", LOCALES)).toBeNull();
    expect(canonicalCountryPathname("/en/reports", LOCALES)).toBeNull();
    expect(canonicalCountryPathname("/en", LOCALES)).toBeNull();
    expect(canonicalCountryPathname("/en/auth/sign-in", LOCALES)).toBeNull();
  });

  it("does not insert anything for the Amazon Region", () => {
    expect(canonicalCountryPathname("/en/reports/abc123", LOCALES)).toBeNull();
  });

  it("leaves a country-shaped segment that is not live alone, so it can 404 as typed", () => {
    expect(canonicalCountryPathname("/en/SUR/reports", LOCALES)).toBeNull();
    expect(canonicalCountryPathname("/en/XYZ", LOCALES)).toBeNull();
  });

  it("waits for the intl middleware to add a locale", () => {
    expect(canonicalCountryPathname("/ecu/reports", LOCALES)).toBeNull();
  });
});

describe("routedPathname", () => {
  it("strips a live code so the route tree never sees it", () => {
    expect(routedPathname("/en/ECU/reports/grid", LOCALES)).toBe("/en/reports/grid");
    expect(routedPathname("/en/ECU", LOCALES)).toBe("/en");
  });

  it("routes the Amazon Region as written", () => {
    expect(routedPathname("/en/reports/grid", LOCALES)).toBeNull();
    expect(routedPathname("/en", LOCALES)).toBeNull();
  });

  it("leaves a code that is not live in the path", () => {
    expect(routedPathname("/en/SUR/reports", LOCALES)).toBeNull();
    expect(routedPathname("/en/XYZ", LOCALES)).toBeNull();
  });
});

describe("isSavedReportPathname", () => {
  it.each(["/reports/7c98f0a6-b1bc-442a-8dcf-9facdad36408", "/reports/anything"])(
    "recognises %s as a saved report",
    (pathname) => {
      expect(isSavedReportPathname(pathname)).toBe(true);
    },
  );

  it.each([
    "/reports",
    "/reports/grid",
    "/reports/indicators",
    "/reports/7c98f0a6/edit",
    "/",
    "/private/my-reports",
  ])("leaves %s to the report tool", (pathname) => {
    expect(isSavedReportPathname(pathname)).toBe(false);
  });
});

describe("getCountryCodes", () => {
  it("treats every shape of 'no module' the same", () => {
    expect(getCountryCodes(null)).toEqual([]);
    expect(getCountryCodes(undefined)).toEqual([]);
    expect(getCountryCodes([])).toEqual([]);
    expect(getCountryCodes([null])).toEqual([]);
  });

  it("accepts a single code as well as a set", () => {
    expect(getCountryCodes("ECU")).toEqual(["ECU"]);
    expect(getCountryCodes(["ECU"])).toEqual(["ECU"]);
  });

  it("sorts and dedupes, so the same set never produces two cache keys", () => {
    expect(getCountryCodes(["PER", "ECU"])).toEqual(getCountryCodes(["ECU", "PER"]));
    expect(getCountryCodes(["ECU", "ECU"])).toEqual(["ECU"]);
  });

  it("drops anything that is not a live module code", () => {
    expect(getCountryCodes(["XYZ", "ECU", "ecu"])).toEqual(["ECU"]);
  });

  it("drops a country that exists but is not available yet", () => {
    expect(getCountryCodes(["BOL"])).toEqual([]);
  });
});
