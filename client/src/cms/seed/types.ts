import type { DefaultNodeTypes, TypedEditorState } from "@payloadcms/richtext-lexical";

/**
 * The shape of the seed dataset (AM-669).
 *
 * Lives next to the seeder rather than with the offline prepare-seed job that
 * produced it: preparing is authoring-time tooling and is not in the repo, while
 * the seeder ships and runs in every environment. Keeping the contract here is
 * what let that tooling go without a refactor.
 */

/** Rich text as the Payload markdown converter emits it. */
export type RichText = TypedEditorState<DefaultNodeTypes>;

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

/**
 * How an Indicator can be rendered. Mirrors `VisualizationTypes` in
 * `@/types/indicator`; the CMS select field offers exactly these values.
 */
export const VISUALIZATION_TYPES = ["map", "table", "chart", "numeric", "ai", "custom"] as const;

export type VisualizationType = (typeof VISUALIZATION_TYPES)[number];

export const isVisualizationType = (value: unknown): value is VisualizationType =>
  typeof value === "string" && (VISUALIZATION_TYPES as readonly string[]).includes(value);

/**
 * One tile in a Topic's or Subtopic's default layout.
 *
 * `indicatorId` is the dataset's own number for the Indicator, not a record id.
 */
export type LayoutEntry = {
  indicatorId: number;
  type: VisualizationType;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Published = {
  /**
   * The dataset's own reference number, and the key other records in the file use
   * to point at this one.
   *
   * **Not** a record id and never stored — the CMS keys these collections by uuid
   * and the seeder uses these numbers only to wire up relationships. Keeps the name
   * `id` because that is what prepare-seed emits into `data/content.json`.
   */
  id: number;
  /** Seeded as published, not draft, or the public site cannot see it. */
  _status: "published";
};

export type TopicRecord = Published & {
  name: Localized<string>;
  description?: Localized<RichText>;
  defaultLayout: LayoutEntry[];
};

export type SubtopicRecord = TopicRecord & {
  /** The parent Topic's dataset number, resolved to a uuid during the seed. */
  topic: number;
};

export type IndicatorRecord = Published & {
  /** The parent Subtopic's dataset number, resolved to a uuid during the seed. */
  subtopic: number;
  order: number;
  name: Localized<string>;
  description?: Localized<RichText>;
  descriptionShort?: Localized<string>;
  unit?: Localized<string>;
  visualizationTypes: VisualizationType[];
  dataSource: DataSource;
};

export type ContentDataset = {
  topics: TopicRecord[];
  subtopics: SubtopicRecord[];
  indicators: IndicatorRecord[];
};

/** The collections the seed writes, in dependency order. */
export const SEEDED_COLLECTIONS = ["topics", "subtopics", "indicators"] as const;

export type SeededCollection = (typeof SEEDED_COLLECTIONS)[number];
