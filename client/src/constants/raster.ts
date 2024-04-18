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
    label: "Extremadamente baja o nula",
    color: "#ffffb2",
  },
  "2": {
    label: "Muy baja",
    color: "#fed976",
  },
  "3": {
    label: "Baja",
    color: "#feb24c",
  },
  "4": {
    label: "Alta",
    color: "#fd8d3c",
  },
  "5": {
    label: "Muy alta",
    color: "#f03b20",
  },
  "6": {
    label: "Extramedamente alta",
    color: "#bd0026",
  },
  "7": {
    label: "Anomalía térmica urbana, industrial, minera",
    color: "#08519c",
  },
  "8": {
    label: "Anomalía térmica geológica (vulcanismo)",
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
    label: "0 m",
    color: "#00a8d0",
  },
  "2": {
    label: "0 - 5 m.",
    color: "#15d06a",
  },
  "3": {
    label: "5 - 100 m.",
    color: "#75e37d",
  },
  "4": {
    label: "100 - 250 m.",
    color: "#d1f58f",
  },
  "5": {
    label: "250 - 500 m.",
    color: "#e8e18c",
  },
  "6": {
    label: "500 - 1.000 m.",
    color: "#baa673",
  },
  "7": {
    label: "1.000 - 3.500 m.",
    color: "#8a6959",
  },
  "8": {
    label: "4.000 - 5.000 m.",
    color: "#a38983",
  },
  "9": {
    label: "5.000 - 6.858,67 m.",
    color: "#d1c4c1",
  },
};

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
