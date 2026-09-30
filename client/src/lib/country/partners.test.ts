import {
  getCountryModuleDescriptionKey,
  getCountryModulePartnerLogos,
  getOtherPartnerLogoRows,
  getPartnerCountries,
  getPartnersHref,
  getRegionalPartnerLogos,
} from "./partners";

describe("getRegionalPartnerLogos", () => {
  it("keeps the regional order and alts", () => {
    expect(getRegionalPartnerLogos("en").map((logo) => logo.alt)).toEqual([
      "ACTO ARO",
      "Development Data Partnership",
      "IDB Atlas",
      "Green Climate Fund",
      "Esri",
      "Vizzuality",
    ]);
  });

  it("only the Green Climate Fund logo carries a size override", () => {
    const overrides = getRegionalPartnerLogos("en")
      .filter((logo) => logo.className)
      .map((logo) => [logo.alt, logo.className]);
    expect(overrides).toEqual([["Green Climate Fund", "h-[72px]"]]);
  });

  it("uses the locale variant of the ACTO logo", () => {
    expect(getRegionalPartnerLogos("pt")[0].src).toBe("/partners/atco-pt.avif");
  });

  it("falls back to the English ACTO logo for an unknown locale", () => {
    expect(getRegionalPartnerLogos("fr")[0].src).toBe("/partners/atco-en.avif");
  });
});

describe("getCountryModulePartnerLogos", () => {
  it("gives each Ecuador partner a short label, in order", () => {
    expect(getCountryModulePartnerLogos("ECU").map((partner) => partner.label)).toEqual([
      "Gobierno del Ecuador",
      "MAE",
      "IGM",
      "INABIO",
      "TNC",
    ]);
  });

  it("returns nothing without a country or partners", () => {
    expect(getCountryModulePartnerLogos(null)).toEqual([]);
    expect(getCountryModulePartnerLogos("BOL")).toEqual([]);
  });
});

describe("getCountryModuleDescriptionKey", () => {
  it("returns the description key stored with the country partners", () => {
    expect(getCountryModuleDescriptionKey("ECU")).toBe("partners-country-module-ECU-description");
  });

  it("returns null without a country or partners", () => {
    expect(getCountryModuleDescriptionKey(null)).toBeNull();
    expect(getCountryModuleDescriptionKey("BOL")).toBeNull();
  });
});

describe("getPartnerCountries", () => {
  it("lists the country entries that have partners", () => {
    expect(getPartnerCountries().map((entry) => entry.code)).toEqual(["ECU"]);
  });
});

describe("getPartnersHref", () => {
  it("carries the country when it has partners", () => {
    expect(getPartnersHref("ECU")).toEqual({ pathname: "/partners", query: { country: "ECU" } });
  });

  it("omits the country when there is none or it has no partners", () => {
    expect(getPartnersHref(null)).toEqual({ pathname: "/partners" });
    expect(getPartnersHref("BOL")).toEqual({ pathname: "/partners" });
  });
});

describe("getOtherPartnerLogoRows", () => {
  it("groups the regional logos into the four design rows", () => {
    expect(getOtherPartnerLogoRows("en").map((row) => row.map((logo) => logo.alt))).toEqual([
      ["ACTO ARO"],
      ["IDB Atlas", "Development Data Partnership"],
      ["Esri", "Vizzuality"],
      ["Green Climate Fund"],
    ]);
  });

  it("uses the locale variant of the ACTO logo", () => {
    expect(getOtherPartnerLogoRows("es")[0][0].src).toBe("/partners/atco-es.avif");
  });

  it("holds the same logos as the regional list", () => {
    const flat = getOtherPartnerLogoRows("pt")
      .flat()
      .map((logo) => logo.src)
      .sort();
    expect(flat).toEqual(
      getRegionalPartnerLogos("pt")
        .map((logo) => logo.src)
        .sort(),
    );
  });
});
