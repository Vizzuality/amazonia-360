import type { SelectField } from "payload";

/**
 * The ways an Indicator can be rendered. Mirrors `VisualizationTypes` in
 * `@/types/indicator` — the app switches on these exact values.
 */
export const VISUALIZATION_TYPE_OPTIONS: NonNullable<SelectField["options"]> = [
  { label: "Map", value: "map" },
  { label: "Table", value: "table" },
  { label: "Chart", value: "chart" },
  { label: "Numeric", value: "numeric" },
  { label: "AI", value: "ai" },
  { label: "Custom", value: "custom" },
];
