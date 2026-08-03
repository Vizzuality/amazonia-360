import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";

export type Locale = "en" | "es" | "pt";

export const LOCALES = ["en", "es", "pt"] as const satisfies readonly Locale[];

/** Locales written by an `update` after the `en` create. */
export const TRANSLATION_LOCALES = ["es", "pt"] as const satisfies readonly Locale[];

/**
 * The source JSON is a flat uniform record: every row carries every key, and absent
 * values are placeholders (`""`, `[]`) rather than missing keys. `0` and `false` are real
 * data and must survive.
 */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Fix 4: trims every text value on the way in. 75 source values carry leading or trailing
 * whitespace — 14 in names, 61 in markdown descriptions. Applied uniformly rather than to
 * an allowlist so it keeps covering rows edited later.
 */
export function text(value: unknown): string | undefined {
  if (isBlank(value)) return undefined;
  return String(value).trim();
}

export function json<T>(value: unknown): T | undefined {
  if (isBlank(value)) return undefined;
  return value as T;
}

export function localized(
  row: Record<string, unknown>,
  field: string,
  locale: Locale,
): string | undefined {
  return text(row[`${field}_${locale}`]);
}

export type RawDefaultVisualization = {
  id: number;
  indicator_id: number;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RawResource = {
  name?: string;
  type?: string;
  url?: string;
  layer_id?: string;
  column?: unknown;
  rasterFunction?: unknown;
  legend?: unknown;
  query_numeric?: unknown;
  query_table?: unknown;
  query_chart?: unknown;
  query_ai?: unknown;
  popupTemplate?: unknown;
};

export type RawTopic = {
  id: number;
  image?: string;
  default_visualization?: RawDefaultVisualization[];
} & Record<string, unknown>;

export type RawSubtopic = {
  id: number;
  topic_id: number;
  default_visualization?: RawDefaultVisualization[];
} & Record<string, unknown>;

export type RawIndicator = {
  id: number;
  subtopic_id: number;
  order: number;
  visualization_types?: string[];
  resource: RawResource;
} & Record<string, unknown>;

export const rawTopics = TOPICS as unknown as RawTopic[];
export const rawSubtopics = SUBTOPICS as unknown as RawSubtopic[];
export const rawIndicators = INDICATORS as unknown as RawIndicator[];
