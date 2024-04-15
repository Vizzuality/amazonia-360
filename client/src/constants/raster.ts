export const LAND_COVER = {
  10: {
    label: "Tree cover",
    color: "#006300",
  },
  20: {
    label: "Shrubland",
    color: "#feba21",
  },
  30: {
    label: "Grassland",
    color: "#fefd4b",
  },
  40: {
    label: "Cropland",
    color: "#ef95fe",
  },
  50: {
    label: "Built-up Land",
    color: "#f90000",
  },
  60: {
    label: "Bare / sparse vegetation",
    color: "#b3b3b3",
  },
  70: {
    label: "Snow and Ice",
    color: "#efefef",
  },
  80: {
    label: "Permanent water bodies",
    color: "#0063c7",
  },
  90: {
    label: "Herbaceous wetland",
    color: "#00959f",
  },
  95: {
    label: "Mangroves",
    color: "#00ce74",
  },
  100: {
    label: "Moss and lichen",
    color: "#f9e59f",
  },
} as const;

export type LandCoverIds = keyof typeof LAND_COVER;
