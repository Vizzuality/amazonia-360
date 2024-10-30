export type VisualizationType = "map" | "table" | "chart" | "numeric";

export type Visualizations = {
  available: VisualizationType[];
  default: VisualizationType;
};
