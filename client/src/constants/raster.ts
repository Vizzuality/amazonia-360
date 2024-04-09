export const LAND_COVER = {
  10: "Tree cover",
  20: "Shrubland",
  30: "Grassland",
  40: "Cropland",
  50: "Built-up Land",
  60: "Bare / sparse vegetation",
  70: "Snow and Ice",
  80: "Permanent water bodies",
  90: "Herbaceous wetland",
  95: "Mangroves",
  100: "Moss and lichen",
} as const;

export type LandCoverIds = keyof typeof LAND_COVER;
