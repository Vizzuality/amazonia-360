import { Populated } from "@/types/cms";
import { Indicator } from "@/types/indicator";
import { Subtopic, Topic, TopicSummary } from "@/types/topic";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { BasemapIds } from "@/constants/basemaps";

import {
  Config,
  Indicator as CmsIndicator,
  Subtopic as CmsSubtopic,
  Topic as CmsTopic,
} from "@/payload-types";

import { sdk } from "@/services/sdk";

type Locale = Config["locale"];

type CmsIndicatorView = NonNullable<CmsTopic["default_visualization"]>[number];

/**
 * `pagination: false` is the whole of the truncation guard. Payload caps a response at 10
 * records otherwise — 10 of 164 Indicators, with nothing raised — and with pagination off
 * there is no page left to silently drop.
 *
 * Nothing here counts what came back, deliberately. A floor compiled into the client turns a
 * legitimate edit — an editor unpublishing a retired indicator — into an empty catalogue for
 * every user, fixable only by a deploy. The counts are asserted in tests instead.
 */
const read = (locale: string) => ({
  locale: locale as Locale,
  fallbackLocale: "en" as const,
  pagination: false,
});

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

/**
 * The runtime half of `Populated<T>`. Payload's generated types describe every depth at once
 * and no query option narrows them, so the depth each read asks for is only a contract until
 * something checks it — and a relationship that quietly came back flat would otherwise reach
 * the UI as a missing name rather than as an error.
 */
const asRecord = <T>(value: T, what: string): Populated<T> => {
  if (typeof value === "string") {
    throw new Error(`${what} came back as the id ${value}: this read lost its depth.`);
  }

  return value as Populated<T>;
};

/** The mirror, for the depth-0 reads that want the id the relationship points at. */
const asId = (value: unknown, what: string): string => {
  if (typeof value !== "string") {
    throw new Error(`${what} came back populated: this read asked for more depth than it needs.`);
  }

  return value;
};

const toIndicatorView = (entry: CmsIndicatorView): IndicatorView => {
  const view = {
    id: entry.id ?? null,
    indicator_id: toNumericId(asId(entry.indicator, "A default visualization's Indicator")),
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

  return { ...view, type: entry.type };
};

const toTopic = (topic: CmsTopic): Topic => ({
  ...topic,
  id: toNumericId(topic.id),
  default_visualization: (topic.default_visualization ?? []).map(toIndicatorView),
});

const toSubtopic = (subtopic: CmsSubtopic): Subtopic => ({
  ...subtopic,
  id: toNumericId(subtopic.id),
  topic_id: toNumericId(asId(subtopic.topic, `Subtopic ${subtopic.id}'s Topic`)),
});

const toIndicator = (indicator: CmsIndicator): Indicator => {
  const subtopic = asRecord(indicator.subtopic, `Indicator ${indicator.id}'s Subtopic`);
  const topic = asRecord(subtopic.topic, `Indicator ${indicator.id}'s Topic`);
  const [resource] = indicator.resource;

  if (!resource) {
    throw new Error(`Indicator ${indicator.id} has no resource`);
  }

  return {
    ...indicator,
    id: toNumericId(indicator.id),
    subtopic: {
      ...subtopic,
      id: toNumericId(subtopic.id),
      topic_id: toNumericId(topic.id),
    },
    topic: { id: toNumericId(topic.id), name: topic.name } satisfies TopicSummary,
    visualization_types: indicator.visualization_types ?? [],
    // The only assertion on the way through. The CMS stores the ArcGIS query and raster
    // objects as opaque JSON and validates nothing about them; ArcGIS is what rejects a
    // malformed one, at the point of use.
    resource: resource as Indicator["resource"],
  };
};

export const fetchTopics = async ({ locale }: { locale: string }): Promise<Topic[]> => {
  const { docs } = await sdk.find({ collection: "topics", ...read(locale), depth: 0 });

  return docs.map(toTopic);
};

export const fetchSubtopics = async ({ locale }: { locale: string }): Promise<Subtopic[]> => {
  const { docs } = await sdk.find({ collection: "subtopics", ...read(locale), depth: 0 });

  return docs.map(toSubtopic);
};

/**
 * `depth: 2` reaches the Topic through the Subtopic, and `populate` stops each of the 164
 * rows dragging a whole Topic — layout array included — along with it. Depth is always
 * explicit: the config default is 2 and would quietly make the two flat reads expensive.
 */
export const fetchIndicators = async ({ locale }: { locale: string }): Promise<Indicator[]> => {
  const { docs } = await sdk.find({
    collection: "indicators",
    ...read(locale),
    depth: 2,
    populate: {
      subtopics: { name: true, description: true, topic: true },
      topics: { name: true },
    },
  });

  return docs.map(toIndicator);
};
