export type Country = {
  iso3: string;
  name: string;
  nameKey: string;
};

export const COUNTRIES = [
  // countries in the amazonas
  {
    iso3: "BRA",
    name: "Brazil",
    nameKey: "country-module-BRA-name",
  },
  {
    iso3: "COL",
    name: "Colombia",
    nameKey: "country-module-COL-name",
  },
  {
    iso3: "PER",
    name: "Peru",
    nameKey: "country-module-PER-name",
  },
  {
    iso3: "VEN",
    name: "Venezuela",
    nameKey: "country-module-VEN-name",
  },
  {
    iso3: "ECU",
    name: "Ecuador",
    nameKey: "country-module-ECU-name",
  },
  {
    iso3: "BOL",
    name: "Bolivia",
    nameKey: "country-module-BOL-name",
  },
  {
    iso3: "GUY",
    name: "Guyana",
    nameKey: "country-module-GUY-name",
  },
  {
    iso3: "SUR",
    name: "Suriname",
    nameKey: "country-module-SUR-name",
  },
  {
    iso3: "GUF",
    name: "French Guiana",
    nameKey: "country-module-GUF-name",
  },
  {
    iso3: "PRY",
    name: "Paraguay",
    nameKey: "country-module-PRY-name",
  },
] as const satisfies readonly Country[];

export type CountryCode = (typeof COUNTRIES)[number]["iso3"];
