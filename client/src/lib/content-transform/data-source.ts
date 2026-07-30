import { seedEnglish } from "./localize";
import type { DataSource, Legend, Popup } from "./types";

/**
 * Reduces a source `resource` object to exactly one data source kind.
 *
 * The source JSON is a flat table export: every resource row carries every
 * column, so a feature layer still has a `rasterFunction` cell and an h3 row
 * still has a `layer_id`. Only the attributes that belong to the row's kind are
 * carried over, which is why Indicator 12's stray raster setting disappears
 * here rather than needing to be hunted down later.
 */

type RawResource = Record<string, unknown>;

const text = (value: unknown): string => (typeof value === "string" ? value : "");

const isFilled = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && !value.length);

const query = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

/** Legend labels become translatable lists seeded with the existing English. */
export const toLegend = (value: unknown): Legend | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const raw = value as { type?: unknown; items?: unknown };
  const items = Array.isArray(raw.items) ? raw.items : [];

  if (!items.length) return undefined;

  return {
    type: text(raw.type) || "basic",
    items: items.map((item) => {
      const entry = item as { color?: unknown; label?: unknown };
      return {
        color: text(entry.color),
        label: seedEnglish(text(entry.label)),
      };
    }),
  };
};

/**
 * Map-popup labels become translatable lists seeded with English. The title is
 * translatable too: it is usually an ArcGIS field substitution like `{NOMBCAP}`,
 * but one Indicator has literal Spanish text there.
 */
export const toPopup = (value: unknown): Popup | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const raw = value as { title?: unknown; content?: unknown };
  const content = Array.isArray(raw.content) ? raw.content : [];

  const fields = content.flatMap((block) => {
    const fieldInfos = (block as { fieldInfos?: unknown }).fieldInfos;
    if (!Array.isArray(fieldInfos)) return [];

    return fieldInfos.map((info) => {
      const field = info as { fieldName?: unknown; label?: unknown };
      return {
        fieldName: text(field.fieldName),
        label: seedEnglish(text(field.label)),
      };
    });
  });

  const title = text(raw.title);

  if (!title && !fields.length) return undefined;

  return {
    ...(title ? { title: seedEnglish(title) } : {}),
    fields,
  };
};

export const toDataSource = (resource: unknown): DataSource => {
  const raw = (resource ?? {}) as RawResource;
  const name = text(raw.name);

  switch (text(raw.type)) {
    case "feature":
      return {
        kind: "feature",
        name,
        url: text(raw.url),
        layerId: text(raw.layer_id),
        queries: {
          table: query(raw.query_table),
          chart: query(raw.query_chart),
          numeric: query(raw.query_numeric),
          ai: query(raw.query_ai),
        },
        ...(toPopup(raw.popupTemplate) ? { popup: toPopup(raw.popupTemplate) } : {}),
      };

    case "imagery":
      return {
        kind: "imagery",
        name,
        url: text(raw.url),
        ...(isFilled(raw.rasterFunction) ? { rasterFunction: text(raw.rasterFunction) } : {}),
        ...(toLegend(raw.legend) ? { legend: toLegend(raw.legend) } : {}),
      };

    case "h3":
      return {
        kind: "h3",
        name,
        column: text(raw.column),
        ...(isFilled(raw.url) ? { url: text(raw.url) } : {}),
      };

    case "component":
      return { kind: "component", name };

    default:
      throw new Error(`Unknown resource type: ${JSON.stringify(raw.type)}`);
  }
};
