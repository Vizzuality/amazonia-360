import { TopicsParserType } from "@/app/parsers";

import { VisualizationType } from "@/containers/report/visualization-types/types";

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
  default_indicators?: string[];
  indicators?: { label: string; value: string; types_available: VisualizationType[] }[];
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
        types_available: ["map", "chart", "numeric"],
      },
      { value: "elevation", label: "Elevation", types_available: ["map", "chart", "numeric"] },
      {
        value: "biomes_by_type",
        label: "Biomes by type",
        types_available: ["map", "numeric"],
      },
      {
        value: "land_cover_by_type",
        label: "Land cover by type",
        types_available: ["chart", "numeric"],
      },
    ],
    default_indicators: ["environment_summary", "elevation"],
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
      { label: "Population", value: "population", types_available: ["chart", "numeric"] },
      {
        label: "Deprivation index",
        value: "deprivation_index",
        types_available: ["chart", "numeric"],
      },
    ],
    default_indicators: ["population"],
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
        types_available: ["chart", "numeric"],
      },
      {
        label: "Protected areas",
        value: "areas_protegidas",
        types_available: ["numeric", "chart"],
      },
      // { label: "Protected areas", value: "protected_areas", types_available: ["chart", "numeric"] },
      {
        label: "Indigenous lands",
        value: "tierras_indigenas",
        types_available: ["numeric", "chart"],
      },
    ],
    default_indicators: ["areas_protegidas", "tierras_indigenas"],
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
        types_available: ["map", "numeric"],
      },
    ],
    default_indicators: ["research_centers"],
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
        types_available: ["map", "numeric"],
      },
      {
        label: "IDB total funding",
        value: "idb_total_funding",
        types_available: ["map", "numeric"],
      },
      {
        label: "IDB operations",
        value: "idb_operations",
        types_available: ["numeric", "map"],
      },
      {
        label: "IDB funding by sector",
        value: "idb_funding_by_sector",
        types_available: ["map", "numeric"],
      },
    ],
    default_indicators: ["idb_operations", "idb_funding_by_sector"],
  },
] as const satisfies Topic[];

type Indicator = {
  id: string;
  type?: VisualizationType;
  size?: [number, number];
};

export type TopicsParsed = {
  id: TopicsParserType;
  visible?: boolean;
  indicators: Indicator[] | undefined;
};

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
  chart: [1, 2],
  numeric: [1, 2],
  table: [2, 2],
};
