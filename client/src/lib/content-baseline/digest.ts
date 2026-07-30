import { createHash } from "node:crypto";

import type { Indicator } from "@/types/indicator";
import type { Subtopic, Topic } from "@/types/topic";

/**
 * Builds a compact, reviewable digest of what the Topic / Subtopic / Indicator
 * lookups return. Used to pin today's behaviour before the CMS migration
 * changes where that content comes from (AM-665).
 *
 * Long free text is reduced to a short hash rather than embedded: the three
 * source JSON files are 1.6 MB, and a fixture that large is not reviewable.
 * Everything a reviewer needs to eyeball — ids, ordering, hierarchy, resource
 * identity, visualization types, names, units — is stored literally.
 */

export const BASELINE_LOCALES = ["en", "es", "pt"] as const;

export type BaselineLocale = (typeof BASELINE_LOCALES)[number];

/**
 * Marker values are used instead of hashing so that "no description at all"
 * and "description present but empty" stay distinguishable in review. Twenty
 * Indicators have an empty English description today, and for three of them
 * (78, 79, 91) Spanish or Portuguese text exists while English does not — so
 * English users see a blank and the fallback cannot help. That has to be
 * visible in the fixture rather than hidden behind a hash.
 */
export const ABSENT = "<absent>";
export const EMPTY = "<empty>";

export const digestText = (value: unknown): string => {
  if (value === undefined || value === null) return ABSENT;
  const text = String(value);
  if (text === "") return EMPTY;
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
};

/** Short values are stored literally — they are the ones worth reading. */
const literal = (value: unknown): string => {
  if (value === undefined || value === null) return ABSENT;
  const text = String(value);
  return text === "" ? EMPTY : text;
};

export type LayoutEntryDigest = {
  indicatorId: number;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ResourceDigest = {
  type: string;
  name: string;
  url: string;
  layerId: string;
  column: string;
  hasRasterFunction: boolean;
  hasPopupTemplate: boolean;
  hasLegend: boolean;
};

export type IndicatorStructureDigest = {
  id: number;
  order: number;
  subtopicId: number;
  topicId: number;
  visualizationTypes: string[];
  resource: ResourceDigest;
};

export type TopicStructureDigest = {
  id: number;
  layout: LayoutEntryDigest[];
};

export type SubtopicStructureDigest = TopicStructureDigest & {
  topicId: number;
};

export type TextDigest = {
  id: number;
  name: string;
  descriptionSha: string;
};

export type IndicatorTextDigest = TextDigest & {
  unit: string;
  descriptionShortSha: string;
};

export type LocaleDigest = {
  /** Ids in the exact order the lookup returned them. Ordering is locale-dependent. */
  topicOrder: number[];
  subtopicOrder: number[];
  indicatorOrder: number[];
  topicText: TextDigest[];
  subtopicText: TextDigest[];
  indicatorText: IndicatorTextDigest[];
};

export type ContentBaseline = {
  counts: { topics: number; subtopics: number; indicators: number };
  /** Locale-independent shape, ordered by id for stable review. */
  structure: {
    topics: TopicStructureDigest[];
    subtopics: SubtopicStructureDigest[];
    indicators: IndicatorStructureDigest[];
  };
  locales: Record<BaselineLocale, LocaleDigest>;
};

type LayoutSource = {
  indicator_id: number;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const digestLayout = (entries: readonly unknown[] | undefined): LayoutEntryDigest[] =>
  (entries ?? []).map((raw) => {
    const entry = raw as LayoutSource;
    return {
      indicatorId: entry.indicator_id,
      type: entry.type,
      x: entry.x,
      y: entry.y,
      w: entry.w,
      h: entry.h,
    };
  });

const digestResource = (resource: Indicator["resource"] | undefined): ResourceDigest => {
  const r = (resource ?? {}) as Record<string, unknown>;
  const column = r.column;
  return {
    type: literal(r.type),
    name: literal(r.name),
    url: literal(r.url),
    layerId: literal(r.layer_id),
    column: Array.isArray(column)
      ? column.length === 0
        ? EMPTY
        : column.join(",")
      : literal(column),
    hasRasterFunction: !!r.rasterFunction,
    hasPopupTemplate: !!r.popupTemplate,
    hasLegend: !!r.legend,
  };
};

export const digestStructure = (
  topics: readonly Topic[],
  subtopics: readonly Subtopic[],
  indicators: readonly Indicator[],
): ContentBaseline["structure"] => ({
  topics: [...topics]
    .sort((a, b) => a.id - b.id)
    .map((topic) => ({ id: topic.id, layout: digestLayout(topic.default_visualization) })),
  subtopics: [...subtopics]
    .sort((a, b) => a.id - b.id)
    .map((subtopic) => ({
      id: subtopic.id,
      topicId: subtopic.topic_id,
      layout: digestLayout(subtopic.default_visualization),
    })),
  indicators: [...indicators]
    .sort((a, b) => a.id - b.id)
    .map((indicator) => ({
      id: indicator.id,
      order: indicator.order,
      subtopicId:
        indicator.subtopic?.id ?? (indicator as unknown as { subtopic_id: number }).subtopic_id,
      topicId: indicator.topic?.id ?? indicator.subtopic?.topic_id,
      visualizationTypes: [...(indicator.visualization_types ?? [])],
      resource: digestResource(indicator.resource),
    })) as IndicatorStructureDigest[],
});

export const digestLocale = (
  topics: readonly Topic[],
  subtopics: readonly Subtopic[],
  indicators: readonly Indicator[],
): LocaleDigest => ({
  topicOrder: topics.map((t) => t.id),
  subtopicOrder: subtopics.map((s) => s.id),
  indicatorOrder: indicators.map((i) => i.id),
  topicText: topics.map((t) => ({
    id: t.id,
    name: literal(t.name),
    descriptionSha: digestText(t.description),
  })),
  subtopicText: subtopics.map((s) => ({
    id: s.id,
    name: literal(s.name),
    descriptionSha: digestText(s.description),
  })),
  indicatorText: indicators.map((i) => ({
    id: i.id,
    name: literal(i.name),
    unit: literal(i.unit),
    descriptionSha: digestText(i.description),
    descriptionShortSha: digestText(i.description_short),
  })),
});
