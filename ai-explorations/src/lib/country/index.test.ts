import { describe, expect, it } from "vitest";

import {
  canonicalCountryPathname,
  countryFromPathname,
  getModuleSlugs,
  getRegionalHomePathname,
  getRegionalPathname,
  isSavedReportPathname,
  isUnscopedPathname,
  resolveCountryHref,
  routedPathname,
  stripCountry,
  withCountry,
} from "./index";

const LOCALES = ["en", "es", "pt"] as const;
const LIVE = ["ECU"];

describe("countryFromPathname", () => {
  it("reads a live code", () => {
    expect(countryFromPathname("/en/ECU/reports/grid", LOCALES, LIVE)).toBe("ECU");
  });

  it("reads the Amazon Region as no country at all", () => {
    expect(countryFromPathname("/en/reports/grid", LOCALES, LIVE)).toBeNull();
    expect(countryFromPathname("/en", LOCALES, LIVE)).toBeNull();
  });

  it("does not mistake a configured-but-unavailable country for a live one", () => {
    expect(countryFromPathname("/en/SUR/reports", LOCALES, LIVE)).toBeNull();
  });

  it("reads a path that has not been given a locale yet", () => {
    expect(countryFromPathname("/ECU/reports", LOCALES, LIVE)).toBe("ECU");
  });
});

describe("withCountry", () => {
  it("prefixes a scoped path", () => {
    expect(withCountry("/reports/grid", "ECU", LIVE)).toBe("/ECU/reports/grid");
  });

  it("leaves the home page out of the module", () => {
    expect(withCountry("/", "ECU", LIVE)).toBe("/");
  });

  it("leaves the path alone for the Amazon Region", () => {
    expect(withCountry("/reports/grid", null, LIVE)).toBe("/reports/grid");
    expect(withCountry("/", null, LIVE)).toBe("/");
  });

  it("leaves unscoped roots alone", () => {
    expect(withCountry("/auth/sign-in", "ECU", LIVE)).toBe("/auth/sign-in");
    expect(withCountry("/private/my-reports", "ECU", LIVE)).toBe("/private/my-reports");
  });

  it("treats the partners page as unscoped", () => {
    expect(isUnscopedPathname("/partners")).toBe(true);
    expect(withCountry("/partners", "ECU", LIVE)).toBe("/partners");
  });

  it("is idempotent", () => {
    expect(withCountry(withCountry("/reports", "ECU", LIVE), "ECU", LIVE)).toBe("/ECU/reports");
    expect(withCountry("/ECU/reports", "BOL", LIVE)).toBe("/ECU/reports");
  });
});

describe("stripCountry", () => {
  it("removes a live code and nothing else", () => {
    expect(stripCountry("/ECU/reports/grid", LIVE)).toBe("/reports/grid");
    expect(stripCountry("/reports/grid", LIVE)).toBe("/reports/grid");
    expect(stripCountry("/SUR/reports", LIVE)).toBe("/SUR/reports");
  });
});

describe("canonicalCountryPathname", () => {
  it("uppercases a lowercase live code", () => {
    expect(canonicalCountryPathname("/en/ecu/reports/grid", LOCALES, LIVE)).toBe(
      "/en/ECU/reports/grid",
    );
  });

  it("leaves everything already canonical alone", () => {
    expect(canonicalCountryPathname("/en/ECU/reports", LOCALES, LIVE)).toBeNull();
    expect(canonicalCountryPathname("/en/reports", LOCALES, LIVE)).toBeNull();
    expect(canonicalCountryPathname("/en", LOCALES, LIVE)).toBeNull();
    expect(canonicalCountryPathname("/en/auth/sign-in", LOCALES, LIVE)).toBeNull();
  });

  it("does not insert anything for the Amazon Region", () => {
    expect(canonicalCountryPathname("/en/reports/abc123", LOCALES, LIVE)).toBeNull();
  });

  it("leaves a country-shaped segment that is not live alone, so it can 404 as typed", () => {
    expect(canonicalCountryPathname("/en/SUR/reports", LOCALES, LIVE)).toBeNull();
    expect(canonicalCountryPathname("/en/XYZ", LOCALES, LIVE)).toBeNull();
  });

  it("waits for the intl middleware to add a locale", () => {
    expect(canonicalCountryPathname("/ecu/reports", LOCALES, LIVE)).toBeNull();
  });
});

describe("routedPathname", () => {
  it("strips a live code so the route tree never sees it", () => {
    expect(routedPathname("/en/ECU/reports/grid", LOCALES, LIVE)).toBe("/en/reports/grid");
    expect(routedPathname("/en/ECU", LOCALES, LIVE)).toBe("/en");
  });

  it("routes the Amazon Region as written", () => {
    expect(routedPathname("/en/reports/grid", LOCALES, LIVE)).toBeNull();
    expect(routedPathname("/en", LOCALES, LIVE)).toBeNull();
  });

  it("leaves a code that is not live in the path", () => {
    expect(routedPathname("/en/SUR/reports", LOCALES, LIVE)).toBeNull();
    expect(routedPathname("/en/XYZ", LOCALES, LIVE)).toBeNull();
  });
});

describe("getRegionalPathname", () => {
  it("drops a live code typed in lowercase in one step", () => {
    expect(getRegionalPathname("/en/ecu/reports", LOCALES, LIVE)).toBe("/en/reports");
  });
});

describe("getRegionalHomePathname", () => {
  it("sends a module's home page to the regional one", () => {
    expect(getRegionalHomePathname("/en/ECU", LOCALES, LIVE)).toBe("/en");
    expect(getRegionalHomePathname("/es/ecu", LOCALES, LIVE)).toBe("/es");
  });

  it("leaves every other path alone", () => {
    expect(getRegionalHomePathname("/en/ECU/reports", LOCALES, LIVE)).toBeNull();
    expect(getRegionalHomePathname("/en", LOCALES, LIVE)).toBeNull();
    expect(getRegionalHomePathname("/en/reports", LOCALES, LIVE)).toBeNull();
    expect(getRegionalHomePathname("/en/BOL", LOCALES, LIVE)).toBeNull();
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

describe("getModuleSlugs", () => {
  it("treats every shape of 'no module' the same", () => {
    expect(getModuleSlugs(null, LIVE)).toEqual([]);
    expect(getModuleSlugs(undefined, LIVE)).toEqual([]);
    expect(getModuleSlugs([], LIVE)).toEqual([]);
    expect(getModuleSlugs([null], LIVE)).toEqual([]);
  });

  it("accepts a single code as well as a set", () => {
    expect(getModuleSlugs("ECU", LIVE)).toEqual(["ECU"]);
    expect(getModuleSlugs(["ECU"], LIVE)).toEqual(["ECU"]);
  });

  it("sorts and dedupes, so the same set never produces two cache keys", () => {
    const live = ["PER", "ECU"];
    expect(getModuleSlugs(["PER", "ECU"], live)).toEqual(["ECU", "PER"]);
    expect(getModuleSlugs(["ECU", "PER"], live)).toEqual(["ECU", "PER"]);
    expect(getModuleSlugs(["ECU", "ECU"], LIVE)).toEqual(["ECU"]);
  });

  it("drops anything that is not a live module code", () => {
    expect(getModuleSlugs(["XYZ", "ECU", "ecu"], LIVE)).toEqual(["ECU"]);
  });

  it("drops a module that exists but is not active", () => {
    expect(getModuleSlugs(["BOL"], LIVE)).toEqual([]);
  });
});

describe("a free-form module slug", () => {
  const live = ["ECU", "bra-para"];

  it("routes, reads and prefixes like a country code", () => {
    expect(countryFromPathname("/en/bra-para/reports", LOCALES, live)).toBe("bra-para");
    expect(routedPathname("/en/bra-para/reports", LOCALES, live)).toBe("/en/reports");
    expect(stripCountry("/bra-para/reports", live)).toBe("/reports");
    expect(withCountry("/reports", "bra-para", live)).toBe("/bra-para/reports");
    expect(withCountry("/bra-para/reports", "ECU", live)).toBe("/bra-para/reports");
  });

  it("is canonicalised to the case it is stored in", () => {
    expect(canonicalCountryPathname("/en/BRA-PARA/reports", LOCALES, live)).toBe(
      "/en/bra-para/reports",
    );
    expect(canonicalCountryPathname("/es/Ecu", LOCALES, live)).toBe("/es/ECU");
    expect(canonicalCountryPathname("/en/bra-para/reports", LOCALES, live)).toBeNull();
  });
});

describe("resolveCountryHref", () => {
  it("prefixes a string href and an object href's pathname", () => {
    expect(resolveCountryHref("/reports", "ECU", LIVE)).toBe("/ECU/reports");
    expect(resolveCountryHref({ pathname: "/reports", query: { a: "1" } }, "ECU", LIVE)).toEqual({
      pathname: "/ECU/reports",
      query: { a: "1" },
    });
  });

  it("leaves an href it cannot read alone", () => {
    const href = { query: { a: "1" } };
    expect(resolveCountryHref(href, "ECU", LIVE)).toBe(href);
    expect(resolveCountryHref("https://example.org/reports", "ECU", LIVE)).toBe(
      "https://example.org/reports",
    );
  });
});
