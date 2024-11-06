export type TopicId =
  | "natural-physical-environment"
  | "sociodemographics"
  | "land-use-and-conservation"
  | "bioeconomy"
  | "financial";

export type Topic = {
  id: TopicId;
  label: string;
  image: string;
  description: string;
  indicators?: { label: string; value: string }[];
};

export const TOPICS = [
  {
    id: "natural-physical-environment",
    label: "Natural Physical Environment",
    image: "/images/topics/natural-physical-environment.png",
    description:
      "Get data on infrastructure, agriculture, mining, logging, livestock, and fishing.",
    indicators: [
      {
        label: "Environment summary",
        value: "environment_summary",
      },
      { value: "elevation", label: "Elevation" },
      { value: "biomes_by_type", label: "Biomes by type" },
      { value: "land_cover_by_type", label: "Land cover by type" },
    ],
  },
  {
    id: "sociodemographics",
    label: "Sociodemographics",
    image: "/images/topics/population.png",
    description: "Understand the demographics of your area of interest.",
    indicators: [
      // {
      //   label: "Summary",
      //   value: "summary",
      // },
      { label: "Population", value: "population" },
      { label: "Deprivation index", value: "deprivation_index" },
    ],
  },
  {
    id: "land-use-and-conservation",
    label: "Land use and Conservation",
    image: "/images/topics/protection.png",
    description:
      "Get data on infrastructure, agriculture, mining, logging, livestock, and fishing.",
    indicators: [
      // {
      //   label: "Summary",
      //   value: "summary",
      // },
      {
        label: "Frequency of forest fires",
        value: "frequency_of_forest_fires",
      },
      { label: "Protected areas", value: "protected_areas" },
      { label: "Indigenous lands", value: "indigenous_lands" },
    ],
  },
  {
    id: "bioeconomy",
    label: "Bioeconomy Research Centers",
    image: "/images/topics/bioeconomy.png",
    description:
      "Data relating to research centers, bioeconomy-related researchers, and other academic endeavors.",
    indicators: [
      {
        label: "Research centers",
        value: "research_centers",
      },
    ],
  },
  {
    id: "financial",
    label: "IDB Operations",
    image: "/images/topics/financial.png",
    description: "Understand the IDB operations in your area of interest.",
    indicators: [
      {
        label: "IDB funding operations",
        value: "idb_funding_operations",
      },
      {
        label: "IDB total funding",
        value: "idb_total_funding",
      },
      {
        label: "IDB operations",
        value: "idb_operations",
      },
      {
        label: "IDB funding by sector",
        value: "idb_funding_by_sector",
      },
    ],
  },
] as const satisfies Topic[];

export const DEFAULT_VISUALIZATION_SIZES: {
  [key: string]: [number, number];
} = {
  map: [2, 4],
  chart: [2, 2],
  numeric: [1, 1],
  table: [2, 2],
};

export const MIN_VISUALIZATION_SIZES: {
  [key: string]: [number, number];
} = {
  map: [2, 2],
  chart: [1, 1],
  numeric: [1, 1],
  table: [2, 2],
};
