import { getRegionalPartnerLogos } from "./partners";

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

  it("uses the locale variant of the ACTO logo", () => {
    expect(getRegionalPartnerLogos("pt")[0].src).toBe("/partners/atco-pt.avif");
  });

  it("falls back to the English ACTO logo for an unknown locale", () => {
    expect(getRegionalPartnerLogos("fr")[0].src).toBe("/partners/atco-en.avif");
  });
});
