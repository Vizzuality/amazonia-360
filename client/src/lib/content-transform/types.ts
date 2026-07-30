import type { RichText } from "./markdown";

/** Locales the platform ships. English is the fallback for the other two. */
export const LOCALES = ["en", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * A translated value. Stored sparsely: `es` and `pt` are present only when they
 * are non-empty and actually differ from `en`, and otherwise fall back.
 */
export type Localized<T> = { en: T } & Partial<Record<Exclude<Locale, "en">, T>>;

export type LegendItem = {
  color: string;
  label: Localized<string>;
};

export type Legend = {
  type: string;
  items: LegendItem[];
};

export type PopupField = {
  fieldName: string;
  label: Localized<string>;
};

export type Popup = {
  /**
   * Either an ArcGIS field substitution such as `{NOMBCAP}` or literal text.
   * Translatable because one Indicator uses literal text here.
   */
  title?: Localized<string>;
  fields: PopupField[];
};

export type FeatureQuery = Record<string, unknown> | null;

/**
 * An Indicator's data source, as exactly one kind carrying only the attributes
 * that kind can have. The source JSON is a flat table export where every row
 * has every column, which is how one Indicator ended up with a raster setting
 * on a feature layer. Splitting by kind makes that unrepresentable.
 */
export type DataSource =
  | {
      kind: "feature";
      name: string;
      url: string;
      layerId: string;
      queries: {
        table: FeatureQuery;
        chart: FeatureQuery;
        numeric: FeatureQuery;
        ai: FeatureQuery;
      };
      popup?: Popup;
    }
  | {
      kind: "imagery";
      name: string;
      url: string;
      rasterFunction?: string;
      legend?: Legend;
    }
  | {
      kind: "h3";
      name: string;
      column: string;
      url?: string;
    }
  | {
      kind: "component";
      name: string;
    };

/** One tile in a Topic's or Subtopic's default layout. */
export type LayoutEntry = {
  indicatorId: number;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Published = {
  /** Original numeric id. Saved reports and shared URLs reference these. */
  id: number;
  /** Loaded as published, not draft, or the public site cannot see it. */
  _status: "published";
};

export type TopicRecord = Published & {
  name: Localized<string>;
  description?: Localized<RichText>;
  defaultLayout: LayoutEntry[];
};

export type SubtopicRecord = TopicRecord & {
  topic: number;
};

export type IndicatorRecord = Published & {
  subtopic: number;
  order: number;
  name: Localized<string>;
  description?: Localized<RichText>;
  descriptionShort?: Localized<string>;
  unit?: Localized<string>;
  visualizationTypes: string[];
  dataSource: DataSource;
};

export type ContentDataset = {
  topics: TopicRecord[];
  subtopics: SubtopicRecord[];
  indicators: IndicatorRecord[];
};
