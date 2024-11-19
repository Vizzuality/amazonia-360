import { Indicator } from "@/app/parsers";

import { VisualizationType } from "@/containers/report/visualization-types/types";

export type TopicId =
  | "nature"
  | "climate"
  | "people"
  | "oil-mining-agriculture-energy"
  | "knowledge"
  | "finance-and-business"
  | "infrastructure-urbanization"
  | "idb-operations";

export type Topic = {
  id: TopicId;
  label: string;
  image: string;
  description: string;
  default_visualization: Indicator[];
  indicators?: { label: string; value: string; types_available: VisualizationType[] }[];
};

export const TOPICS: Topic[] = [
  {
    id: "nature",
    label: "Nature",
    image: "/images/topics/nature.png",
    description: "Get data on life zones, ecosystems, habitats, and conservation areas.",
    indicators: [
      {
        label: "Topographic Altitude",
        value: "topographic_altitude",
        types_available: ["map", "chart"],
      },
      { label: "Topographic Slope", value: "topographic_slope", types_available: ["map", "chart"] },
      {
        label: "Terrestrial Biome Types",
        value: "terrestrial_biome_types",
        types_available: ["map", "chart"],
      },
      { label: "Ecosystems", value: "ecosystems", types_available: ["map", "chart", "table"] },
      {
        label: "Conservation Priority Indicator",
        value: "conservation_priority_indicator",
        types_available: ["map"],
      },
      { label: "Protected Areas", value: "protected_areas", types_available: ["numeric"] },
      {
        label: "WorldCover Class Coverage",
        value: "worldcover_class_coverage",
        types_available: ["chart"],
      },
      { label: "Basic Species Count", value: "basic_species_count", types_available: ["numeric"] },
      {
        label: "Carbon Sequestered in Biomass",
        value: "carbon_sequestered_biomass",
        types_available: ["map", "numeric"],
      },
    ],
    default_visualization: [
      { id: "conservation_priority_indicator", type: "map", x: 0, y: 0, w: 2, h: 4 },
      { id: "ecosystems", type: "map", x: 2, y: 0, w: 2, h: 4 },
      { id: "topographic_altitude", type: "chart", x: 0, y: 4, w: 2, h: 2 },
      { id: "worldcover_class_coverage", type: "chart", x: 2, y: 4, w: 2, h: 2 },
      { id: "protected_areas", type: "numeric", x: 0, y: 6, w: 1, h: 1 },
      { id: "carbon_sequestered_biomass", type: "numeric", x: 1, y: 6, w: 1, h: 1 },
      { id: "basic_species_count", type: "numeric", x: 2, y: 6, w: 1, h: 1 },
    ],
  },
  {
    id: "climate",
    label: "Climate",
    image: "/images/topics/climate.png",
    description: "Data on climate types, precipitation, temperature, and drought risk.",
    indicators: [
      { label: "Köppen Climate Types", value: "koppen_climate_types", types_available: ["map"] },
      { label: "Annual Precipitation", value: "annual_precipitation", types_available: ["chart"] },
      { label: "Annual Temperature", value: "annual_temperature", types_available: [] },
      {
        label: "Drought Risk Index",
        value: "drought_risk_index",
        types_available: ["numeric", "map"],
      },
      { label: "Fire Frequency", value: "fire_frequency", types_available: ["chart"] },
      {
        label: "Cumulative Forest Loss Indicator",
        value: "forest_loss_indicator",
        types_available: ["numeric"],
      },
    ],
    default_visualization: [
      { id: "koppen_climate_types", type: "map", x: 0, y: 0, w: 2, h: 4 },
      { id: "annual_precipitation", type: "chart", x: 2, y: 0, w: 2, h: 4 },
      { id: "fire_frequency", type: "chart", x: 0, y: 4, w: 2, h: 2 },
      { id: "drought_risk_index", type: "numeric", x: 2, y: 4, w: 2, h: 2 },
      { id: "forest_loss_indicator", type: "numeric", x: 0, y: 6, w: 2, h: 2 },
    ],
  },
  {
    id: "people",
    label: "People",
    image: "/images/topics/people.png",
    description: "Data on population, access to services, health, and education.",
    indicators: [
      {
        label: "Total Population - GHSPOP 2025",
        value: "total_population_ghspop_2025",
        types_available: ["numeric"],
      },
      {
        label: "Access to Public Transport",
        value: "access_public_transport",
        types_available: ["numeric"],
      },
      { label: "Access to Electricity", value: "access_electricity", types_available: ["numeric"] },
      {
        label: "Higher Education Centers",
        value: "higher_education_centers",
        types_available: ["map"],
      },
      { label: "Primary Health Index", value: "primary_health_index", types_available: ["map"] },
    ],
    default_visualization: [
      { id: "primary_health_index", type: "map", x: 0, y: 0, w: 2, h: 4 },
      { id: "higher_education_centers", type: "map", x: 2, y: 0, w: 2, h: 4 },
      { id: "access_public_transport", type: "numeric", x: 0, y: 4, w: 1, h: 1 },
      { id: "access_electricity", type: "numeric", x: 1, y: 4, w: 1, h: 1 },
      { id: "total_population_ghspop_2025", type: "numeric", x: 2, y: 4, w: 1, h: 1 },
    ],
  },
  {
    id: "oil-mining-agriculture-energy",
    label: "Oil, Mining, Agriculture, Energy",
    image: "/images/topics/oil-mining-agriculture-energy.png",
    description: "Data on resources including oil, mining, and agricultural indicators.",
    indicators: [
      {
        label: "Mining Concession Indicator",
        value: "mining_concession_indicator",
        types_available: ["map", "table", "chart"],
      },
      {
        label: "Illegal Mining Indicator",
        value: "illegal_mining_indicator",
        types_available: ["map", "chart", "numeric"],
      },
      {
        label: "Oil Concession Indicator",
        value: "oil_concession_indicator",
        types_available: ["numeric", "map", "chart"],
      },
      {
        label: "Cultivated Area Indicator",
        value: "cultivated_area_indicator",
        types_available: ["numeric", "map", "chart"],
      },
    ],
    default_visualization: [
      {
        id: "cultivated_area_indicator",
        type: "numeric",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: "illegal_mining_indicator",
        type: "numeric",
        x: 1,
        y: 0,
        w: 1,
        h: 1,
      },
      // TO - DO - from here not in the spreadsheet
      { id: "oil_concession_indicator", type: "numeric", x: 0, y: 1, w: 1, h: 1 },
      { id: "mining_concession_indicator", type: "numeric", x: 1, y: 1, w: 1, h: 1 },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    image: "/images/topics/knowledge.png",
    description: "Database of knowledge products and resources.",
    indicators: [
      {
        label: "Knowledge Products Database",
        value: "knowledge_products_database",
        types_available: ["table"],
      },
    ],
    default_visualization: [
      { id: "knowledge_products_database", type: "table", x: 0, y: 0, w: 2, h: 4 },
    ],
  },
  {
    id: "finance-and-business",
    label: "Finance and Business",
    image: "/images/topics/finance-and-business.png",
    description: "Economic and financial data, including GDP and banking locations.",
    indicators: [
      { label: "GDP", value: "gdp", types_available: ["map"] },
      {
        label: "Location of Banking Entities (OMS/Google)",
        value: "banking_entities_location",
        types_available: ["map"],
      },
    ],
    default_visualization: [
      { id: "gdp", type: "map", x: 0, y: 0, w: 2, h: 4 },
      { id: "banking_entities_location", type: "map", x: 2, y: 0, w: 2, h: 4 },
    ],
  },
  {
    id: "infrastructure-urbanization",
    label: "Infrastructure, urbanization",
    image: "/images/topics/infrastructure-urbanization.png",
    description: "Data on infrastructure such as ports, airports, and road networks.",
    indicators: [
      { label: "Total Road Network", value: "total_road_network", types_available: ["map"] },
      {
        label: "Human Settlements (total 2025)",
        value: "human_settlements_2025",
        types_available: ["map"],
      },
      { label: "Ookla Connection Data", value: "ookla_connection_data", types_available: ["map"] },
    ],
    default_visualization: [
      { id: "human_settlements_2025", type: "map", x: 0, y: 0, w: 2, h: 4 },
      { id: "total_road_network", type: "map", x: 2, y: 0, w: 2, h: 4 },
    ],
  },
  {
    id: "idb-operations",
    label: "IDB Operations",
    image: "/images/topics/idb-operations.png",
    description: "IDB development operations and impact data.",
    // TO - DO - Different from
    indicators: [
      {
        label: "Action Areas DB (#74) (exp)",
        value: "action_areas_database",
        types_available: ["numeric"],
      },
    ],
    default_visualization: [
      { id: "action_areas_database", type: "numeric", x: 0, y: 0, w: 2, h: 4 },
    ],
  },
];

export type TopicsParsed = {
  id: string | number;
  visible?: boolean;
  indicators: Indicator[] | undefined;
};

export const DEFAULT_VISUALIZATION_SIZES: {
  [key: string]: { w: number; h: number };
} = {
  map: { w: 2, h: 4 },
  chart: { w: 2, h: 1 },
  numeric: { w: 1, h: 1 },
  table: { w: 2, h: 4 },
};

export const MIN_VISUALIZATION_SIZES: {
  [key: string]: { w: number; h: number };
} = {
  map: { w: 2, h: 4 },
  chart: { w: 2, h: 1 },
  numeric: { w: 1, h: 1 },
  table: { w: 2, h: 4 },
};
