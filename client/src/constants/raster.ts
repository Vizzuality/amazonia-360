import { convertHexToRgbaArray } from "@/lib/utils";

export const LAND_COVER = {
  "10": {
    label: "Tree cover",
    color: "#006300",
  },
  "20": {
    label: "Shrubland",
    color: "#feba21",
  },
  "30": {
    label: "Grassland",
    color: "#fefd4b",
  },
  "40": {
    label: "Cropland",
    color: "#ef95fe",
  },
  "50": {
    label: "Built-up Land",
    color: "#f90000",
  },
  "60": {
    label: "Bare / sparse vegetation",
    color: "#b3b3b3",
  },
  "70": {
    label: "Snow and Ice",
    color: "#efefef",
  },
  "80": {
    label: "Permanent water bodies",
    color: "#0063c7",
  },
  "90": {
    label: "Herbaceous wetland",
    color: "#00959f",
  },
  "95": {
    label: "Mangroves",
    color: "#00ce74",
  },
  "100": {
    label: "Moss and lichen",
    color: "#f9e59f",
  },
} as const;

export const LAND_COVER_COLORMAP = Object.keys(LAND_COVER).reduce(
  (acc, key) => ({
    ...acc,
    [key]: convertHexToRgbaArray(
      LAND_COVER[key as keyof typeof LAND_COVER].color,
    ),
  }),
  {} as Record<keyof typeof LAND_COVER, string>,
);

export type LandCoverIds = keyof typeof LAND_COVER;

export const FIRES = {
  "1": {
    label: "Extremely low or null",
    color: "#ffffb2",
  },
  "2": {
    label: "Very low",
    color: "#fed976",
  },
  "3": {
    label: "Low",
    color: "#feb24c",
  },
  "4": {
    label: "High",
    color: "#fd8d3c",
  },
  "5": {
    label: "Very high",
    color: "#f03b20",
  },
  "6": {
    label: "Extremely high",
    color: "#bd0026",
  },
  "7": {
    label: "Urban, industrial, mining thermal anomaly",
    color: "#08519c",
  },
  "8": {
    label: "Geological thermal anomaly (volcanism)",
    color: "#810f7c",
  },
};

export const FIRES_COLORMAP = Object.keys(FIRES).reduce(
  (acc, key) => ({
    ...acc,
    [key]: convertHexToRgbaArray(FIRES[key as keyof typeof FIRES].color),
  }),
  {} as Record<keyof typeof FIRES, string>,
);

export type FireIds = keyof typeof FIRES;

export const ELEVATION_RANGES = {
  "1": {
    range: [0, 0],
    label: "0 m",
    color: "#00a8d0",
  },
  "2": {
    range: [0, 5],
    label: "0 - 5 m.",
    color: "#15d06a",
  },
  "3": {
    range: [5, 100],
    label: "5 - 100 m.",
    color: "#75e37d",
  },
  "4": {
    range: [100, 250],
    label: "100 - 250 m.",
    color: "#d1f58f",
  },
  "5": {
    range: [250, 500],
    label: "250 - 500 m.",
    color: "#e8e18c",
  },
  "6": {
    range: [500, 1000],
    label: "500 - 1.000 m.",
    color: "#baa673",
  },
  "7": {
    range: [1000, 3500],
    label: "1.000 - 3.500 m.",
    color: "#8a6959",
  },
  "8": {
    range: [3500, 5000],
    label: "4.000 - 5.000 m.",
    color: "#a38983",
  },
  "9": {
    range: [5000, 6858.67],
    label: "5.000 - 6.858,67 m.",
    color: "#d1c4c1",
  },
} as const;

export const ELEVATION_RANGES_COLORMAP = Object.keys(ELEVATION_RANGES).reduce(
  (acc, key) => ({
    ...acc,
    [key]: convertHexToRgbaArray(
      ELEVATION_RANGES[key as keyof typeof ELEVATION_RANGES].color,
    ),
  }),
  {} as Record<keyof typeof ELEVATION_RANGES, string>,
);

export type ElevationRangeIds = keyof typeof ELEVATION_RANGES;

export const BIOMES = {
  "1": {
    label: "Tropical and Subtropical Moist Broadleaf Forests",
    color: "#014600",
  },
  "2": {
    label: "Tropical and Subtropical Dry Broadleaf Forests",
    color: "#607a22",
  },
  "7": {
    label: "Tropical and Subtropical Grasslands, Savannas and Shrublands",
    color: "#9b950e",
  },
  "9": {
    label: "Flooded Grasslands and Savannas",
    color: "#2a8384",
  },
  "10": {
    label: "Montane Grasslands and Shrublands",
    color: "#814229",
  },
  "13": {
    label: "Deserts and Xeric Shrublands",
    color: "#f5e759",
  },
  "14": {
    label: "Mangroves",
    color: "#8dccbd",
  },
} as const;

export type BiomesIds = keyof typeof BIOMES;

export const CLIMATE_TYPES = {
  Af: {
    label: "Tropical, rainforest",
    color: "#0001FE",
  },
  Csb: {
    label: "Temperate, dry summer, warm summer",
    color: "#C6C700",
  },
  Cfb: {
    label: "Temperate, no dry season, warm summer",
    color: "#66FF33",
  },
  Am: {
    label: "Tropical, monsoon",
    color: "#0077FF",
  },
  Aw: {
    label: "Tropical, savannah",
    color: "#46A9FA",
  },
  BWk: {
    label: "Arid, desert, cold",
    color: "#FE9695",
  },
  BSk: {
    label: "Arid, steppe, cold",
    color: "#FEDB63",
  },
  BSh: {
    label: "Arid, steppe, hot",
    color: "#F5A300",
  },
  ET: {
    label: "Polar, tundra or frost",
    color: "#B2B2B2",
  },
} as const;

export type ClimateTypesIds = keyof typeof CLIMATE_TYPES;
