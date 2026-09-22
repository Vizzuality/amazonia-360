import { Locale } from "next-intl";

import { Indicator, ResourceFeature } from "@/types/indicator";
import { Subtopic, Topic } from "@/types/topic";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { BasemapIds } from "@/constants/basemaps";

import {
  Indicator as CmsIndicator,
  Subtopic as CmsSubtopic,
  Topic as CmsTopic,
} from "@/payload-types";

import { sdk } from "@/services/sdk";

type CmsIndicatorView = NonNullable<CmsTopic["default_visualization"]>[number];
type CmsResource = CmsIndicator["resource"][number];
type CmsPopupTemplate = Extract<CmsResource, { blockType: "feature" }>["popupTemplate"];

// `pagination: false` is the truncation guard: Payload otherwise caps a response at 10 records,
// silently. Nothing here counts what came back — a floor compiled into the client would turn an
// unpublished indicator into an empty catalogue for everyone. The counts are asserted in tests.
const read = (locale: string) => ({
  locale: locale as Locale,
  fallbackLocale: "en" as const,
  pagination: false,
});

/**
 * The CMS keys the catalogue by varchar; saved reports and shared URLs hold numbers. Coercing
 * here and nowhere else means neither has to change. The corollary: never ask the CMS to sort by
 * id — varchar sorts 0, 1, 10, 100, 11.
 */
const toNumericId = (id: string): number => {
  const parsed = Number(id);

  // Number("") is 0, which is both a real Topic and a real Indicator.
  if (id.trim() === "" || !Number.isInteger(parsed)) {
    throw new TypeError(`Expected a numeric content id, got ${JSON.stringify(id)}`);
  }

  return parsed;
};

/**
 * An unsorted read is answered `-createdAt`, so the catalogue arrives newest first — the reverse
 * of the order it was authored in. Every screen that re-sorted hid that; the PDF report renders
 * the read as it comes, and showed its topics backwards. Order is part of what this boundary
 * hands over, so it is settled here, on the numeric id the CMS itself cannot sort by.
 */
const byId = <T extends { id: number }>(records: T[]): T[] =>
  records.toSorted((a, b) => a.id - b.id);

/**
 * No query option narrows Payload's relationship types, so the depth a read asks for is only a
 * contract until something checks it. A flat relationship would reach the UI as a missing name.
 */
const asRecord = <T>(value: T, what: string): Exclude<T, string> => {
  if (typeof value === "string") {
    throw new TypeError(`${what} came back as the id ${value}: this read lost its depth.`);
  }

  return value as Exclude<T, string>;
};

/** The mirror, for the depth-0 reads that want the id the relationship points at. */
const asId = (value: unknown, what: string): string => {
  if (typeof value !== "string") {
    throw new TypeError(
      `${what} came back populated: this read asked for more depth than it needs.`,
    );
  }

  return value;
};

/** The boundary emits `undefined`, never `null`: the app's own optionality is undefined-based. */
const text = (value?: string | null) => value ?? undefined;

/**
 * ArcGIS wants `content`; the CMS stores the field list flat. Ten features carry a title and no
 * fields, where an empty `content` would drop the popup instead of showing the bare title.
 */
const toPopupTemplate = (
  popupTemplate: CmsPopupTemplate,
): __esri.PopupTemplateProperties | undefined => {
  const title = text(popupTemplate?.title);
  const fieldInfos = (popupTemplate?.fieldInfos ?? []).map(({ fieldName, label }) => ({
    fieldName,
    label: text(label),
  }));

  if (!title && !fieldInfos.length) return undefined;

  return {
    title,
    content: fieldInfos.length ? [{ type: "fields", fieldInfos }] : undefined,
  };
};

const toResource = (resource: CmsResource): Indicator["resource"] => {
  if (resource.blockType === "feature") {
    const { blockType, popupTemplate, ...rest } = resource;

    return {
      ...rest,
      type: blockType,
      popupTemplate: toPopupTemplate(popupTemplate),
    } as ResourceFeature;
  }

  const { blockType, ...rest } = resource;

  return { ...rest, type: blockType } as Indicator["resource"];
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
      basemapId: (entry.basemapId ?? undefined) as BasemapIds | undefined,
      opacity: entry.opacity ?? undefined,
    };
  }

  return { ...view, type: entry.type };
};

const toTopic = (topic: CmsTopic): Topic => ({
  ...topic,
  id: toNumericId(topic.id),
  description: text(topic.description),
  // Only the Overview Topic has none, and it never renders as a card.
  image: topic.image ?? "",
  default_visualization: (topic.default_visualization ?? []).map(toIndicatorView),
});

const toSubtopic = (subtopic: CmsSubtopic): Subtopic => ({
  ...subtopic,
  id: toNumericId(subtopic.id),
  description: text(subtopic.description),
  topic_id: toNumericId(asId(subtopic.topic, `Subtopic ${subtopic.id}'s Topic`)),
});

const toIndicator = (indicator: CmsIndicator): Indicator => {
  const subtopic = asRecord(indicator.subtopic, `Indicator ${indicator.id}'s Subtopic`);
  const topic = asRecord(subtopic.topic, `Indicator ${indicator.id}'s Topic`);
  const topicId = toNumericId(topic.id);
  const [resource] = indicator.resource;

  if (!resource) {
    throw new Error(`Indicator ${indicator.id} has no resource`);
  }

  return {
    ...indicator,
    id: toNumericId(indicator.id),
    description: text(indicator.description),
    unit: text(indicator.unit),
    subtopic: {
      ...subtopic,
      id: toNumericId(subtopic.id),
      description: text(subtopic.description),
      topic_id: topicId,
    },
    topic: { id: topicId, name: topic.name },
    visualization_types: indicator.visualization_types ?? [],
    resource: toResource(resource),
  };
};

// `joins: false` keeps Topics.subtopics and Subtopics.indicators — admin-only fields — out of
// these two reads. A join populates at every depth, `depth: 0` included, and `toTopic` and
// `toSubtopic` spread the document, so without it every Topic and Subtopic would drag a list of
// child ids into the app's own types and down the RSC payload.
export const fetchTopics = async ({ locale }: { locale: string }): Promise<Topic[]> => {
  const { docs } = await sdk.find({
    collection: "topics",
    ...read(locale),
    depth: 0,
    joins: false,
  });

  return byId(docs.map(toTopic));
};

export const fetchSubtopics = async ({ locale }: { locale: string }): Promise<Subtopic[]> => {
  const { docs } = await sdk.find({
    collection: "subtopics",
    ...read(locale),
    depth: 0,
    joins: false,
  });

  return byId(docs.map(toSubtopic));
};

// `depth: 2` reaches the Topic through the Subtopic; `populate` stops all 164 rows dragging a
// whole Topic along with it. Depth is always explicit — the config default would make the two
// flat reads expensive.
export const fetchIndicators = async ({ locale }: { locale: string }): Promise<Indicator[]> => {
  const { docs } = await sdk.find({
    collection: "indicators",
    ...read(locale),
    // Country-scoped indicators are seeded but withheld until there is a module UI to put them
    // behind. Delete this first when that work starts — nothing else keeps them off the screen.
    where: { country: { exists: false } },
    depth: 2,
    populate: {
      subtopics: { name: true, topic: true },
      topics: { name: true },
    },
  });

  return docs.map(toIndicator);
};
