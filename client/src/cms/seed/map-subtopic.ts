import { omitUndefined } from "./map-topic";
import { localized, type Locale, type RawSubtopic } from "./source";
import { SUBTOPIC_NAMES } from "./translations";

export type SubtopicBaseData = {
  legacy_id: number;
  topic: string;
  name: string;
  description?: string;
};

export type SubtopicLocaleData = {
  name?: string;
  description?: string;
};

/**
 * `image` exists on the source rows but on 0 of 28 with a value, and `Subtopics` has no
 * such field, so it is dropped.
 */
export function mapSubtopicBase(row: RawSubtopic, topicIds: Map<number, string>): SubtopicBaseData {
  const name = localized(row, "name", "en");
  if (!name) throw new Error(`subtopic ${row.id}: missing name_en`);

  const topic = topicIds.get(row.topic_id);
  if (!topic) throw new Error(`subtopic ${row.id}: unresolvable topic ${row.topic_id}`);

  return {
    legacy_id: row.id,
    topic,
    name,
    ...omitUndefined({ description: localized(row, "description", "en") }),
  };
}

/** The source has no ES or PT subtopic names, so they come from the translation table. */
export function mapSubtopicLocale(row: RawSubtopic, locale: Locale): SubtopicLocaleData {
  return omitUndefined({
    name: locale === "en" ? localized(row, "name", "en") : SUBTOPIC_NAMES[row.id]?.[locale],
    description: localized(row, "description", locale),
  });
}
