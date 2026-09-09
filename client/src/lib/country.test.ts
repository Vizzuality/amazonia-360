import { AMAZON_REGION, countryFromPathname } from "./country";

const LOCALES = ["en", "es", "pt"] as const;

describe("countryFromPathname", () => {
  test("reads the segment after the locale", () => {
    expect(countryFromPathname("/en/ECU/reports/grid", LOCALES)).toBe("ECU");
    expect(countryFromPathname("/pt/~", LOCALES)).toBe(AMAZON_REGION);
  });

  test("reads a path that carries no locale prefix", () => {
    expect(countryFromPathname("/ECU/reports", LOCALES)).toBe("ECU");
  });

  test("a route that carries no country reads as the Amazon Region", () => {
    expect(countryFromPathname("/en/auth/sign-in", LOCALES)).toBe(AMAZON_REGION);
    expect(countryFromPathname("/en/private/my-reports", LOCALES)).toBe(AMAZON_REGION);
    expect(countryFromPathname("/en", LOCALES)).toBe(AMAZON_REGION);
    expect(countryFromPathname("/", LOCALES)).toBe(AMAZON_REGION);
  });

  test("a country that is not available is not a country", () => {
    // The route 404s on these, and until it does the picker must not claim one is active.
    expect(countryFromPathname("/en/SUR/reports", LOCALES)).toBe(AMAZON_REGION);
    expect(countryFromPathname("/en/ecu/reports", LOCALES)).toBe(AMAZON_REGION);
  });
});
