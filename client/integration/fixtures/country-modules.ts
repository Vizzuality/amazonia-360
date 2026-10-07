import type { CountryModule, Partner } from "@/lib/country-modules";

export const ECU_MODULE: CountryModule = {
  id: "ecu-module",
  slug: "ECU",
  country: "ECU",
  name: "Ecuador",
  moduleName: "Ecuador Amazonia",
  partnersDescription: null,
  bbox: null,
};

export function getPartnerFixture(overrides: Partial<Partner> = {}): Partner {
  return {
    id: "p",
    name: "Partner",
    label: null,
    logo: "/partners/p.avif",
    logoSize: "default",
    regional: false,
    moduleIds: [],
    ...overrides,
  };
}
