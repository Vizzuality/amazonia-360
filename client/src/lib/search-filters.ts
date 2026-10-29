import type { CountryCode } from "@/constants/countries";
import { LOCATION_TYPES, LocationType } from "@/constants/search";

export type SearchSourceProperties =
  | __esri.LayerSearchSourceProperties
  | __esri.LocatorSearchSourceProperties;

export const INDIGENOUS_COUNTRY_NAMES: Record<CountryCode, string> = {
  BRA: "Brasil",
  COL: "Colombia",
  PER: "Perú",
  VEN: "Venezuela",
  ECU: "Ecuador",
  BOL: "Bolivia",
  GUY: "Guyana",
  SUR: "Suriname",
};

const getProtectedAreaFilter = (
  geometry: __esri.GeometryUnion | null,
): __esri.SearchSourceFilter => (geometry ? { geometry } : { where: "1 = 0" });

export const getCountrySourceOverrides = (
  country: CountryCode,
  geometry: __esri.GeometryUnion | null,
): Record<LocationType, Partial<SearchSourceProperties>> => {
  const admin = { filter: { where: `GID_0 = '${country}'` } };

  return {
    country: admin,
    state: admin,
    municipality: admin,
    capital: { filter: { where: `ISO = '${country}'` } },
    city: { countryCode: country },
    "protected-area": { filter: getProtectedAreaFilter(geometry) },
    "indigenous-territory": {
      filter: { where: `pais = '${INDIGENOUS_COUNTRY_NAMES[country]}'` },
    },
  };
};

export const getSources = <T>(
  sources: Record<LocationType, T>,
  overrides?: Partial<Record<LocationType, Partial<T>>>,
): T[] => LOCATION_TYPES.map((type) => ({ ...sources[type], ...overrides?.[type] }));
