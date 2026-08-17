import { localized, text, type Locale, type RawTopic } from "./source";

export type TopicBaseData = {
  legacy_id: number;
  name: string;
  description?: string;
  image?: string;
};

export type TopicLocaleData = {
  name?: string;
  description?: string;
};

/**
 * The `en` payload plus every non-localized field. `default_visualization` is deliberately
 * omitted: it references indicators, which do not exist until pass 3, so pass 4 backfills it.
 */
export function mapTopicBase(row: RawTopic): TopicBaseData {
  const name = localized(row, "name", "en");
  if (!name) throw new Error(`topic ${row.id}: missing name_en`);

  return {
    legacy_id: row.id,
    name,
    ...omitUndefined({
      description: localized(row, "description", "en"),
      image: text(row.image),
    }),
  };
}

export function mapTopicLocale(row: RawTopic, locale: Locale): TopicLocaleData {
  return omitUndefined({
    name: localized(row, "name", locale),
    description: localized(row, "description", locale),
  });
}

/** Keeps `undefined` keys out of the payload so Payload does not clear existing values. */
export function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
