export type MosaicIds =
  | "total_area_km2"
  | "total_population_estimated_by_2025"
  | "amazon_area_km2"
  | "percentage_of_amazon_area_in_the_country"
  | "share_of_total_amazon_area"
  | "amazon_population_estimated_by_2025"
  | "percentage_of_amazon_population_in_the_country"
  | "share_of_total_amazon_population";

export const MOSAIC_OPTIONS = [
  {
    key: "total_area_km2",
    label: "Total area (km2)",
  },
  {
    key: "total_population_estimated_by_2025",
    label: "Total population (estimated by 2025)",
  },
  { key: "amazon_area_km2", label: "Amazonia Area in km2" },
  {
    key: "percentage_of_amazon_area_in_the_country",
    label: "Percentage of Amazon area in the country",
  },
  {
    key: "share_of_total_amazon_area",
    label: "Share of total Amazonia area %",
  },
  {
    key: "amazon_population_estimated_by_2025",
    label: "Amazon population (estimated by 2025)",
  },
  {
    key: "percentage_of_amazon_population_in_the_country",
    label: "Percentage of Amazon population in the country",
  },
  {
    key: "share_of_total_amazon_population",
    label: "Share of total Amazon population)",
  },
] as const;

export const MOSAIC_DATA = [
  {
    country: "Brazil",
    total_area_km2: 8471713,
    total_population_estimated_by_2025: 216853567,
    amazon_area_km2: 5194160,
    percentage_of_amazon_area_in_the_country: 0.61,
    share_of_total_amazon_area: 0.63,
    amazon_population_estimated_by_2025: 31448141,
    percentage_of_amazon_population_in_the_country: 0.15,
    share_of_total_amazon_population: 0.52,
  },
  {
    country: "Peru",
    total_area_km2: 1292370,
    total_population_estimated_by_2025: 34463536,
    amazon_area_km2: 962663,
    percentage_of_amazon_area_in_the_country: 0.74,
    share_of_total_amazon_area: 0.12,
    amazon_population_estimated_by_2025: 11169785,
    percentage_of_amazon_population_in_the_country: 0.32,
    share_of_total_amazon_population: 0.19,
  },
  {
    country: "Colombia",
    total_area_km2: 1135810,
    total_population_estimated_by_2025: 52283101,
    amazon_area_km2: 482649,
    percentage_of_amazon_area_in_the_country: 0.42,
    share_of_total_amazon_area: 0.06,
    amazon_population_estimated_by_2025: 1565224,
    percentage_of_amazon_population_in_the_country: 0.03,
    share_of_total_amazon_population: 0.03,
  },
  {
    country: "Bolivia",
    total_area_km2: 1083797,
    total_population_estimated_by_2025: 12788910,
    amazon_area_km2: 711730,
    percentage_of_amazon_area_in_the_country: 0.66,
    share_of_total_amazon_area: 0.09,
    amazon_population_estimated_by_2025: 8518321,
    percentage_of_amazon_population_in_the_country: 0.67,
    share_of_total_amazon_population: 0.14,
  },
  {
    country: "Venezuela",
    total_area_km2: 911915,
    total_population_estimated_by_2025: 29709777,
    amazon_area_km2: 468935,
    percentage_of_amazon_area_in_the_country: 0.51,
    share_of_total_amazon_area: 0.06,
    amazon_population_estimated_by_2025: 2119466,
    percentage_of_amazon_population_in_the_country: 0.07,
    share_of_total_amazon_population: 0.04,
  },
  {
    country: "Ecuador",
    total_area_km2: 255020,
    total_population_estimated_by_2025: 18301185,
    amazon_area_km2: 131415,
    percentage_of_amazon_area_in_the_country: 0.52,
    share_of_total_amazon_area: 0.02,
    amazon_population_estimated_by_2025: 3688679,
    percentage_of_amazon_population_in_the_country: 0.2,
    share_of_total_amazon_population: 0.06,
  },
  {
    country: "Guyana",
    total_area_km2: 210740,
    total_population_estimated_by_2025: 827247,
    amazon_area_km2: 210939,
    percentage_of_amazon_area_in_the_country: 1,
    share_of_total_amazon_area: 0.03,
    amazon_population_estimated_by_2025: 827247,
    percentage_of_amazon_population_in_the_country: 1,
    share_of_total_amazon_population: 0.01,
  },
  {
    country: "Suriname",
    total_area_km2: 145785,
    total_population_estimated_by_2025: 628406,
    amazon_area_km2: 145487,
    percentage_of_amazon_area_in_the_country: 1,
    share_of_total_amazon_area: 0.02,
    amazon_population_estimated_by_2025: 628406,
    percentage_of_amazon_population_in_the_country: 1,
    share_of_total_amazon_population: 0.01,
  },
];
