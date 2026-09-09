export type LocalizedValue = { en: string; es?: string; pt?: string };

export type RawPopupTemplate = {
  title?: string;
  content?: { fieldInfos?: { fieldName: string; label: string }[] }[];
};

export type Legend = { type: "basic"; items: { label: string; color: string }[] };

/** What Payload's `json` field type actually accepts/returns — not `unknown`. */
export type JsonValue = string | number | boolean | { [k: string]: unknown } | unknown[] | null;

export type RawResource = {
  name: string;
  type: "feature" | "imagery" | "imagery-tile" | "web-tile" | "h3" | "component";
  column: string | string[];
  layer_id: string;
  rasterFunction: JsonValue;
  legend: Legend;
  url: string;
  query_numeric: JsonValue;
  query_table: JsonValue;
  query_chart: JsonValue;
  query_ai: JsonValue;
  popupTemplate: RawPopupTemplate | "";
};

export type MappedPopupTemplate = {
  title?: string;
  fieldInfos: { fieldName: string; label: string }[];
};

export type MappedResourceBlock =
  | {
      blockType: "feature";
      name?: string;
      url: string;
      layer_id: string;
      popupTemplate?: MappedPopupTemplate;
      query_numeric?: JsonValue;
      query_table?: JsonValue;
      query_chart?: JsonValue;
      query_ai?: JsonValue;
    }
  | {
      blockType: "imagery" | "imagery-tile";
      name?: string;
      url: string;
      rasterFunction: JsonValue;
      legend: Legend;
    }
  | { blockType: "web-tile"; name?: string; url: string }
  | { blockType: "h3"; name: string; column: string; url?: string }
  | { blockType: "component"; name: string; query_ai?: JsonValue };

export type RawVisualizationEntry = {
  indicator_id: number;
  type: "map" | "chart" | "table" | "numeric" | "custom" | "ai";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MappedVisualizationEntry = {
  indicator: string;
  type: RawVisualizationEntry["type"];
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RawTopic = {
  id: number;
  name_en: string;
  name_es: string;
  name_pt: string;
  image: string;
  description_en: string;
  description_es: string;
  description_pt: string;
  default_visualization: RawVisualizationEntry[];
};

export type RawSubtopic = {
  id: number;
  topic_id: number;
  name_en: string;
  name_es: string;
  name_pt: string;
  description_en: string;
  description_es: string;
  description_pt: string;
  default_visualization: RawVisualizationEntry[];
};

export type RawIndicator = {
  id: number;
  subtopic_id: number;
  order: number;
  name_en: string;
  name_es: string;
  name_pt: string;
  unit_en: string;
  unit_es: string;
  unit_pt: string;
  description_en: string;
  description_es: string;
  description_pt: string;
  description_short_en: string;
  description_short_es: string;
  description_short_pt: string;
  visualization_types: ("map" | "table" | "chart" | "numeric")[];
  resource: RawResource;
};
