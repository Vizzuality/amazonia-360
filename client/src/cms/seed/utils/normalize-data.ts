import { isEmptyValue } from "@/cms/test-utils/find-field";

import type {
  LocalizedValue,
  MappedPopupTemplate,
  MappedResourceBlock,
  MappedVisualizationEntry,
  RawResource,
  RawVisualizationEntry,
} from "./types";

export const localizeValue = (en: string, es: string, pt: string): LocalizedValue => {
  const value: LocalizedValue = { en };
  if (!isEmptyValue(es)) value.es = es;
  if (!isEmptyValue(pt)) value.pt = pt;
  return value;
};

export const mapResource = (raw: RawResource): MappedResourceBlock => {
  switch (raw.type) {
    case "feature":
      return {
        blockType: "feature",
        name: emptyToUndefined(raw.name),
        url: raw.url,
        layer_id: raw.layer_id,
        popupTemplate: mapPopupTemplate(raw.popupTemplate),
        query_numeric: emptyToUndefined(raw.query_numeric),
        query_table: emptyToUndefined(raw.query_table),
        query_chart: emptyToUndefined(raw.query_chart),
        query_ai: emptyToUndefined(raw.query_ai),
      };
    case "imagery":
    case "imagery-tile":
      return {
        blockType: raw.type,
        name: emptyToUndefined(raw.name),
        url: raw.url,
        rasterFunction: raw.rasterFunction,
        legend: raw.legend,
      };
    case "web-tile":
      return { blockType: "web-tile", name: emptyToUndefined(raw.name), url: raw.url };
    case "h3":
      return {
        blockType: "h3",
        name: raw.name,
        column: raw.column as string,
        url: emptyToUndefined(raw.url),
      };
    case "component":
      return { blockType: "component", name: raw.name, query_ai: emptyToUndefined(raw.query_ai) };
    default:
      throw new Error(`Unknown resource.type "${(raw as { type: string }).type}"`);
  }
};

export const mapDefaultVisualization = (
  entries: RawVisualizationEntry[],
  validIndicatorIds: Set<string>,
): { mapped: MappedVisualizationEntry[]; droppedIndicatorIds: number[] } => {
  const mapped: MappedVisualizationEntry[] = [];
  const droppedIndicatorIds: number[] = [];

  for (const entry of entries) {
    const indicator = String(entry.indicator_id);
    if (!validIndicatorIds.has(indicator)) {
      droppedIndicatorIds.push(entry.indicator_id);
      continue;
    }
    mapped.push({ indicator, type: entry.type, x: entry.x, y: entry.y, w: entry.w, h: entry.h });
  }

  return { mapped, droppedIndicatorIds };
};

// ---------- HELPERS ----------

const mapPopupTemplate = (raw: RawResource["popupTemplate"]): MappedPopupTemplate | undefined => {
  if (raw === "") return undefined;

  const fieldInfos = raw.content?.[0]?.fieldInfos ?? [];
  return { title: raw.title, fieldInfos };
};

const emptyToUndefined = <T>(value: T): T | undefined => (isEmptyValue(value) ? undefined : value);
