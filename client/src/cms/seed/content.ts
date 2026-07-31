import type { Payload } from "payload";

import type {
  ContentDataset,
  DataSource,
  IndicatorRecord,
  LayoutEntry,
  Locale,
  Localized,
  SubtopicRecord,
  TopicRecord,
} from "@/lib/content-transform/types";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/content-transform/types";

/**
 * Loads the reviewed dataset into the CMS (AM-669).
 *
 * Contains no conversion logic of its own — all the judgement happened in the
 * transform and was signed off there. That keeps the result identical on
 * staging and production and makes re-running trivial.
 *
 * Two things fail quietly if got wrong, so both are enforced here:
 *
 *  - Records must keep their **original numeric ids**. Renumbering the
 *    catalogue breaks every saved report and every shared report URL.
 *  - Records must be created **published**. Loaded as drafts they appear in the
 *    admin but are invisible to the public site, which looks exactly like a
 *    caching problem.
 *
 * Loading happens in two phases because a Topic's default layout points at
 * Indicators, which do not exist while the Topics are being created. Topics and
 * Subtopics land first without layouts, then Indicators, then the layouts are
 * attached.
 */

export type LoadReport = {
  topics: number;
  subtopics: number;
  indicators: number;
  layoutsAttached: number;
};

const atLocale = <T>(value: Localized<T> | undefined, locale: Locale): T | undefined =>
  value?.[locale as keyof Localized<T>] as T | undefined;

/** Locales other than the default that carry a genuinely different value. */
const translatedLocales = <T>(value: Localized<T> | undefined): Locale[] =>
  LOCALES.filter((locale) => locale !== DEFAULT_LOCALE && atLocale(value, locale) !== undefined);

/** Blocks are identified by `blockType`; the dataset calls the discriminant `kind`. */
const toBlock = (dataSource: DataSource) => {
  const { kind, ...rest } = dataSource as DataSource & Record<string, unknown>;

  if (kind === "feature") {
    const source = dataSource as Extract<DataSource, { kind: "feature" }>;
    return {
      blockType: "feature",
      name: source.name,
      url: source.url,
      layerId: source.layerId,
      queries: source.queries,
      ...(source.popup
        ? {
            popup: {
              ...(source.popup.title
                ? { title: atLocale(source.popup.title, DEFAULT_LOCALE) }
                : {}),
              fields: source.popup.fields.map((field) => ({
                fieldName: field.fieldName,
                label: atLocale(field.label, DEFAULT_LOCALE),
              })),
            },
          }
        : {}),
    };
  }

  if (kind === "imagery") {
    const source = dataSource as Extract<DataSource, { kind: "imagery" }>;
    return {
      blockType: "imagery",
      name: source.name,
      url: source.url,
      ...(source.rasterFunction ? { rasterFunction: source.rasterFunction } : {}),
      ...(source.legend
        ? {
            legend: {
              type: source.legend.type,
              items: source.legend.items.map((item) => ({
                color: item.color,
                label: atLocale(item.label, DEFAULT_LOCALE),
              })),
            },
          }
        : {}),
    };
  }

  return { blockType: kind, ...rest };
};

const toLayout = (entries: LayoutEntry[]) =>
  entries.map((entry) => ({
    indicator: entry.indicatorId,
    type: entry.type,
    x: entry.x,
    y: entry.y,
    w: entry.w,
    h: entry.h,
  }));

/**
 * Updates one record, selected by a `where` clause rather than passed as `id`.
 *
 * Payload's update treats a falsy `id` as "no id given" and then rejects the
 * call for having no `where`. This catalogue's ids start at zero — Topic 0 is
 * the overview Topic — so passing the id directly fails on the very first
 * record.
 */
const updateById = async ({
  payload,
  collection,
  id,
  data,
  locale,
}: {
  payload: Payload;
  collection: "topics" | "subtopics" | "indicators";
  id: number;
  data: Record<string, unknown>;
  locale: Locale;
}) => {
  const result = await payload.update({
    collection,
    where: { id: { equals: id } },
    data,
    locale,
    overrideAccess: true,
  });

  if (result.errors?.length) {
    throw new Error(`Failed to update ${collection} ${id}: ${JSON.stringify(result.errors)}`);
  }

  if (!result.docs.length) {
    throw new Error(`Update of ${collection} ${id} matched no records`);
  }
};

/**
 * Creates or updates a record under its original id, published, in the default
 * locale, then writes the locales that genuinely differ.
 */
const upsert = async ({
  payload,
  collection,
  id,
  base,
  translations,
}: {
  payload: Payload;
  collection: "topics" | "subtopics" | "indicators";
  id: number;
  base: Record<string, unknown>;
  translations: Partial<Record<Locale, Record<string, unknown>>>;
}) => {
  const existing = await payload.find({
    collection,
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });

  const data = { ...base, id, _status: "published" as const };

  if (existing.docs.length) {
    await updateById({ payload, collection, id, data, locale: DEFAULT_LOCALE });
  } else {
    await payload.create({ collection, data, locale: DEFAULT_LOCALE, overrideAccess: true });
  }

  for (const [locale, fields] of Object.entries(translations)) {
    if (!fields || !Object.keys(fields).length) continue;

    await updateById({
      payload,
      collection,
      id,
      data: { ...fields, _status: "published" as const },
      locale: locale as Locale,
    });
  }
};

/**
 * Splits localized text into the default-locale payload and one payload per
 * locale that genuinely differs, since Payload writes one locale at a time.
 */
const splitText = (fields: readonly { key: string; value: Localized<unknown> | undefined }[]) => {
  const base: Record<string, unknown> = {};
  const translations: Partial<Record<Locale, Record<string, unknown>>> = {};

  for (const { key, value } of fields) {
    if (!value) continue;

    const defaultValue = atLocale(value, DEFAULT_LOCALE);
    if (defaultValue !== undefined) base[key] = defaultValue;

    for (const locale of translatedLocales(value)) {
      translations[locale] ??= {};
      translations[locale]![key] = atLocale(value, locale);
    }
  }

  return { base, translations };
};

export const loadContent = async ({
  payload,
  dataset,
  log = () => {},
}: {
  payload: Payload;
  dataset: ContentDataset;
  log?: (message: string) => void;
}): Promise<LoadReport> => {
  // Phase 1: Topics and Subtopics without layouts — the Indicators they point
  // at do not exist yet.
  for (const topic of dataset.topics) {
    const { base, translations } = splitText([
      { key: "name", value: topic.name },
      { key: "description", value: topic.description },
    ]);

    await upsert({ payload, collection: "topics", id: topic.id, base, translations });
  }
  log(`topics: ${dataset.topics.length}`);

  for (const subtopic of dataset.subtopics) {
    const { base, translations } = splitText([
      { key: "name", value: subtopic.name },
      { key: "description", value: subtopic.description },
    ]);

    await upsert({
      payload,
      collection: "subtopics",
      id: subtopic.id,
      base: { ...base, topic: subtopic.topic },
      translations,
    });
  }
  log(`subtopics: ${dataset.subtopics.length}`);

  // Phase 2: Indicators, which reference Subtopics that now exist.
  for (const indicator of dataset.indicators) {
    const { base, translations } = splitText([
      { key: "name", value: indicator.name },
      { key: "description", value: indicator.description },
      { key: "descriptionShort", value: indicator.descriptionShort },
      { key: "unit", value: indicator.unit },
    ]);

    await upsert({
      payload,
      collection: "indicators",
      id: indicator.id,
      base: {
        ...base,
        subtopic: indicator.subtopic,
        order: indicator.order,
        visualizationTypes: indicator.visualizationTypes,
        dataSource: [toBlock(indicator.dataSource)],
      },
      translations,
    });
  }
  log(`indicators: ${dataset.indicators.length}`);

  // Phase 3: attach the layouts now that every Indicator resolves.
  let layoutsAttached = 0;

  for (const topic of dataset.topics) {
    if (!topic.defaultLayout.length) continue;

    await updateById({
      payload,
      collection: "topics",
      id: topic.id,
      data: { defaultLayout: toLayout(topic.defaultLayout), _status: "published" },
      locale: DEFAULT_LOCALE,
    });
    layoutsAttached += 1;
  }

  for (const subtopic of dataset.subtopics) {
    if (!subtopic.defaultLayout.length) continue;

    await updateById({
      payload,
      collection: "subtopics",
      id: subtopic.id,
      data: { defaultLayout: toLayout(subtopic.defaultLayout), _status: "published" },
      locale: DEFAULT_LOCALE,
    });
    layoutsAttached += 1;
  }
  log(`layouts attached: ${layoutsAttached}`);

  return {
    topics: dataset.topics.length,
    subtopics: dataset.subtopics.length,
    indicators: dataset.indicators.length,
    layoutsAttached,
  };
};
