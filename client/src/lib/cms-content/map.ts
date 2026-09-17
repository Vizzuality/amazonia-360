import { Indicator, ResourceFeature, VisualizationTypes } from "@/types/indicator";
import { Subtopic, Topic, TopicSummary } from "@/types/topic";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { BasemapIds } from "@/constants/basemaps";

import { LegendItemProps } from "@/components/map/legend/item";

import {
  CmsIndicator,
  CmsJson,
  CmsLegend,
  CmsIndicatorSubtopic,
  CmsPopupTemplate,
  CmsResourceBlock,
  CmsSubtopic,
  CmsTopic,
  CmsTopicSummary,
  CmsVisualizationEntry,
} from "./types";

/**
 * The CMS keys the catalogue by varchar (`cms/fields/source-id.ts`); everything downstream is
 * numeric — saved reports store `topic_id`/`indicator_id` as numbers with no foreign key, and
 * the `defaultTopics` URL parser validates numbers. Coercion happens here and nowhere else, so
 * no saved report and no shared URL has to change.
 *
 * The corollary: never ask the CMS to sort by id. varchar sorts lexicographically
 * (0, 1, 10, 100, 11), which would reorder the catalogue without raising anything.
 */
const toNumericId = (id: string): number => {
  const parsed = Number(id);

  // Number("") is 0, which is both a real Topic and a real Indicator — an empty id has to
  // fail here rather than resolve to the wrong record.
  if (typeof id !== "string" || id.trim() === "" || !Number.isInteger(parsed)) {
    throw new Error(`Expected a numeric content id, got ${JSON.stringify(id)}`);
  }

  return parsed;
};

const optional = (value: string | null | undefined): string | undefined => value ?? undefined;

const toIndicatorView = (entry: CmsVisualizationEntry): IndicatorView => {
  const view = {
    id: entry.id ?? null,
    indicator_id: toNumericId(entry.indicator),
    x: entry.x,
    y: entry.y,
    w: entry.w,
    h: entry.h,
  };

  if (entry.type === "map") {
    return {
      ...view,
      type: "map",
      ...(entry.basemapId ? { basemapId: entry.basemapId as BasemapIds } : {}),
      ...(typeof entry.opacity === "number" ? { opacity: entry.opacity } : {}),
    };
  }

  return { ...view, type: entry.type as Exclude<VisualizationTypes, "map"> };
};

export const toTopic = (topic: CmsTopic): Topic => ({
  id: toNumericId(topic.id),
  name: topic.name,
  description: optional(topic.description),
  image: topic.image ?? "",
  default_visualization: (topic.default_visualization ?? []).map(toIndicatorView),
});

const toTopicSummary = (topic: CmsTopicSummary): TopicSummary => ({
  id: toNumericId(topic.id),
  name: topic.name,
});

export const toSubtopic = (subtopic: CmsSubtopic): Subtopic => ({
  id: toNumericId(subtopic.id),
  topic_id: toNumericId(subtopic.topic),
  name: subtopic.name,
  description: optional(subtopic.description),
});

/**
 * Payload nests the Topic under the Subtopic where the app holds them as siblings, so the
 * Indicator's Subtopic is flattened back to a `topic_id`. A projection of what `depth=2`
 * already returned in the requested locale — not a second lookup.
 */
const toIndicatorSubtopic = (subtopic: CmsIndicatorSubtopic): Subtopic => ({
  id: toNumericId(subtopic.id),
  topic_id: toNumericId(subtopic.topic.id),
  name: subtopic.name,
  description: optional(subtopic.description),
});

/**
 * ArcGIS wants `content`, the CMS stores the field list flat. Every popup in the source data
 * is a single `fields` block, which is why the group has no content-type of its own.
 *
 * Ten features carry a title and no fields at all, so `content` is omitted rather than left
 * empty — returning nothing for those would drop their popup instead of showing a bare title.
 */
const toPopupTemplate = (
  popupTemplate: CmsPopupTemplate | null | undefined,
): __esri.PopupTemplateProperties | undefined => {
  const title = optional(popupTemplate?.title);
  const fieldInfos = popupTemplate?.fieldInfos ?? [];

  if (!title && !fieldInfos.length) return undefined;

  return {
    ...(title ? { title } : {}),
    ...(fieldInfos.length
      ? {
          content: [
            {
              type: "fields",
              fieldInfos: fieldInfos.map(({ fieldName, label }) => ({
                fieldName,
                label: optional(label),
              })),
            },
          ],
        }
      : {}),
  };
};

/**
 * Payload gives every array row an id, but only once it has been saved — a legend item added
 * through the REST API has none until then, so it falls back to its position.
 */
const toLegend = (legend: CmsLegend): LegendItemProps => ({
  type: legend.type,
  items: legend.items.map((item, index) => ({ ...item, id: item.id ?? index })),
});

/** Payload stores the ArcGIS query objects as opaque JSON; ArcGIS validates them on use. */
const toQuery = (value: CmsJson | undefined): ResourceFeature["query_ai"] =>
  (value as ResourceFeature["query_ai"]) ?? null;

const toResource = (block: CmsResourceBlock): Indicator["resource"] => {
  switch (block.blockType) {
    case "feature":
      return {
        type: "feature",
        name: block.name ?? "",
        url: block.url,
        layer_id: block.layer_id,
        popupTemplate: toPopupTemplate(block.popupTemplate),
        query_table: toQuery(block.query_table),
        query_chart: toQuery(block.query_chart),
        query_numeric: toQuery(block.query_numeric),
        query_ai: toQuery(block.query_ai),
      };
    case "imagery":
      return {
        type: "imagery",
        name: block.name ?? "",
        url: block.url,
        rasterFunction: block.rasterFunction as __esri.RasterFunctionProperties,
        legend: toLegend(block.legend),
        aggregation: block.aggregation,
      };
    case "imagery-tile":
      return {
        type: "imagery-tile",
        name: block.name ?? "",
        url: block.url,
        rasterFunction: block.rasterFunction as __esri.RasterFunctionProperties,
        legend: toLegend(block.legend),
      };
    case "web-tile":
      return { type: "web-tile", name: block.name ?? "", url: block.url };
    case "h3":
      return { type: "h3", name: block.name, column: block.column, url: optional(block.url) };
    case "component":
      return { type: "component", name: block.name };
  }
};

export const toIndicator = (indicator: CmsIndicator): Indicator => {
  const [resource] = indicator.resource;

  if (!resource) {
    throw new Error(`Indicator ${indicator.id} has no resource`);
  }

  return {
    id: toNumericId(indicator.id),
    order: indicator.order,
    name: indicator.name,
    unit: optional(indicator.unit),
    description: optional(indicator.description),
    description_short: indicator.description_short,
    subtopic: toIndicatorSubtopic(indicator.subtopic),
    topic: toTopicSummary(indicator.subtopic.topic),
    visualization_types: indicator.visualization_types ?? [],
    default_visualization_type: indicator.default_visualization_type ?? null,
    resource: toResource(resource),
  };
};
