import type { Payload } from "payload";

import type {
  ContentDataset,
  DataSource,
  LayoutEntry,
  Locale,
  Localized,
  SeededCollection,
} from "./types";
import { DEFAULT_LOCALE, LOCALES } from "./types";

/**
 * Seeds the reviewed dataset into the CMS (AM-669).
 *
 * Contains no conversion logic of its own — all the judgement happened in the
 * offline prepare-seed job and was signed off there.
 *
 * Payload mints the uuids. The dataset's own numbers are correlation keys for this
 * run only, used to wire a Subtopic to its Topic and a layout tile to its
 * Indicator, and are never stored.
 *
 * Two things fail quietly if got wrong, so both are enforced: records must be
 * created **published**, or they are invisible to the public site; and localized
 * text must be written per locale and only where a locale differs, or an empty
 * string blocks the fallback to English.
 *
 * Three phases, because a Topic's layout points at Indicators that do not exist
 * while the Topics are being created.
 *
 * Create-only, so it expects an empty database — `assertSafeToSeed` enforces that
 * and `clearContent` is how the forced path gets there.
 */

export type SeedReport = {
  topics: number;
  subtopics: number;
  indicators: number;
  layoutsAttached: number;
};

/** Dataset number → the uuid Payload gave that record on this run. */
type Minted = Map<number, string>;

/**
 * Records a number→uuid pairing, refusing a number the dataset already used.
 *
 * A repeat would overwrite the earlier entry and quietly re-parent its children,
 * and every downstream check would still pass: both records exist, so the counts
 * and the hierarchy look right.
 */
const remember = ({
  minted,
  number,
  id,
  kind,
}: {
  minted: Minted;
  number: number;
  id: string;
  kind: string;
}) => {
  if (minted.has(number)) {
    throw new Error(`the dataset defines ${kind} ${number} more than once`);
  }

  minted.set(number, id);
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

/**
 * Resolves a dataset number to the uuid the record was given, so a number the
 * dataset never defines stops the seed instead of writing a null relationship.
 *
 * `Map.get` rather than a truthiness check: number 0 is a real reference.
 */
const mintedId = ({
  minted,
  number,
  kind,
  context,
}: {
  minted: Minted;
  number: number;
  kind: "topic" | "subtopic" | "indicator";
  context: string;
}): string => {
  const id = minted.get(number);

  if (id === undefined) {
    throw new Error(`${context} references ${kind} ${number}, which the dataset does not define`);
  }

  return id;
};

const toLayout = ({
  entries,
  indicators,
  context,
}: {
  entries: LayoutEntry[];
  indicators: Minted;
  context: string;
}) =>
  entries.map((entry) => ({
    indicator: mintedId({
      minted: indicators,
      number: entry.indicatorId,
      kind: "indicator",
      context: `layout of ${context}`,
    }),
    type: entry.type,
    x: entry.x,
    y: entry.y,
    w: entry.w,
    h: entry.h,
  }));

/** Creates one published record, writes the locales that differ, returns its uuid. */
const createRecord = async ({
  payload,
  collection,
  base,
  translations,
}: {
  payload: Payload;
  collection: SeededCollection;
  base: Record<string, unknown>;
  translations: Partial<Record<Locale, Record<string, unknown>>>;
}): Promise<string> => {
  const created = await payload.create({
    collection,
    data: { ...base, _status: "published" },
    locale: DEFAULT_LOCALE,
    overrideAccess: true,
  });

  const id = created.id;

  if (typeof id !== "string") {
    throw new Error(`${collection} was created without a uuid id (got ${JSON.stringify(id)})`);
  }

  for (const [locale, fields] of Object.entries(translations)) {
    if (!fields || !Object.keys(fields).length) continue;

    await payload.update({
      collection,
      id,
      data: { ...fields, _status: "published" as const },
      locale: locale as Locale,
      overrideAccess: true,
    });
  }

  return id;
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

/** How a record is named in an error message, since it has no number to quote. */
const quotedName = (name: Localized<string>) => `"${atLocale(name, DEFAULT_LOCALE) ?? "unnamed"}"`;

export const seedContent = async ({
  payload,
  dataset,
  log = () => {},
}: {
  payload: Payload;
  dataset: ContentDataset;
  log?: (message: string) => void;
}): Promise<SeedReport> => {
  const topicIds: Minted = new Map();
  const subtopicIds: Minted = new Map();
  const indicatorIds: Minted = new Map();

  // Phase 1: Topics and Subtopics without layouts — the Indicators they point
  // at do not exist yet.
  for (const topic of dataset.topics) {
    const { base, translations } = splitText([
      { key: "name", value: topic.name },
      { key: "description", value: topic.description },
    ]);

    remember({
      minted: topicIds,
      number: topic.id,
      kind: "topic",
      id: await createRecord({ payload, collection: "topics", base, translations }),
    });
  }
  log(`topics: ${dataset.topics.length}`);

  for (const subtopic of dataset.subtopics) {
    const { base, translations } = splitText([
      { key: "name", value: subtopic.name },
      { key: "description", value: subtopic.description },
    ]);

    const topic = mintedId({
      minted: topicIds,
      number: subtopic.topic,
      kind: "topic",
      context: `subtopic ${quotedName(subtopic.name)}`,
    });

    remember({
      minted: subtopicIds,
      number: subtopic.id,
      kind: "subtopic",
      id: await createRecord({
        payload,
        collection: "subtopics",
        base: { ...base, topic },
        translations,
      }),
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

    const subtopic = mintedId({
      minted: subtopicIds,
      number: indicator.subtopic,
      kind: "subtopic",
      context: `indicator ${quotedName(indicator.name)}`,
    });

    remember({
      minted: indicatorIds,
      number: indicator.id,
      kind: "indicator",
      id: await createRecord({
        payload,
        collection: "indicators",
        base: {
          ...base,
          subtopic,
          order: indicator.order,
          visualizationTypes: indicator.visualizationTypes,
          dataSource: [toBlock(indicator.dataSource)],
        },
        translations,
      }),
    });
  }
  log(`indicators: ${dataset.indicators.length}`);

  // Phase 3: attach the layouts now that every Indicator resolves.
  let layoutsAttached = 0;

  const attachLayout = async ({
    collection,
    id,
    entries,
    context,
  }: {
    collection: "topics" | "subtopics";
    id: string;
    entries: LayoutEntry[];
    context: string;
  }) => {
    await payload.update({
      collection,
      id,
      data: {
        defaultLayout: toLayout({ entries, indicators: indicatorIds, context }),
        _status: "published",
      },
      locale: DEFAULT_LOCALE,
      overrideAccess: true,
    });
    layoutsAttached += 1;
  };

  for (const topic of dataset.topics) {
    if (!topic.defaultLayout.length) continue;

    await attachLayout({
      collection: "topics",
      id: mintedId({
        minted: topicIds,
        number: topic.id,
        kind: "topic",
        context: `layout owner ${quotedName(topic.name)}`,
      }),
      entries: topic.defaultLayout,
      context: `topic ${quotedName(topic.name)}`,
    });
  }

  for (const subtopic of dataset.subtopics) {
    if (!subtopic.defaultLayout.length) continue;

    await attachLayout({
      collection: "subtopics",
      id: mintedId({
        minted: subtopicIds,
        number: subtopic.id,
        kind: "subtopic",
        context: `layout owner ${quotedName(subtopic.name)}`,
      }),
      entries: subtopic.defaultLayout,
      context: `subtopic ${quotedName(subtopic.name)}`,
    });
  }
  log(`layouts attached: ${layoutsAttached}`);

  return {
    topics: dataset.topics.length,
    subtopics: dataset.subtopics.length,
    indicators: dataset.indicators.length,
    layoutsAttached,
  };
};
