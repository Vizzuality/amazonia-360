import type { Payload } from "payload";

import type { ContentDataset, SeededCollection } from "./types";
import { LOCALES, SEEDED_COLLECTIONS } from "./types";

/**
 * Checks a seeded database looks right (AM-669).
 *
 * Covers the failure modes that are silent — the ones where the seed reports
 * success and the site is quietly wrong: a short count, a broken hierarchy,
 * layout tiles pointing at Indicators that no longer exist, the curated
 * cross-Topic layout being flattened, a locale resolving to a blank name, records
 * left as drafts, and content invisible to an anonymous reader.
 *
 * Findings name records rather than numbering them, because a uuid tells the
 * operator nothing about which record is broken.
 *
 * Returns the problems instead of exiting, so the seed can fail on them and a
 * test can assert on them.
 */

export type ExpectedCounts = Record<SeededCollection, number>;

export type VerifyResult = {
  /** Human-readable findings, in check order. Printed by the caller. */
  lines: string[];
  /** Empty means everything passed. */
  problems: string[];
};

export const expectedFrom = (dataset: ContentDataset): ExpectedCounts => ({
  topics: dataset.topics.length,
  subtopics: dataset.subtopics.length,
  indicators: dataset.indicators.length,
});

/** A relationship field comes back as a uuid or as a populated object. */
const refId = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const { id } = value as { id?: unknown };
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Record_ = {
  id: unknown;
  name?: unknown;
  defaultLayout?: { indicator?: unknown }[] | null;
};

/** How a record is identified in a finding. Its name, falling back to its id. */
const label = (record: Record_) =>
  typeof record.name === "string" && record.name.trim() !== ""
    ? `"${record.name}"`
    : `id ${String(record.id)}`;

export const verifySeed = async ({
  payload,
  expected,
}: {
  payload: Payload;
  expected: ExpectedCounts;
}): Promise<VerifyResult> => {
  const lines: string[] = [];
  const problems: string[] = [];

  const all = async <S extends SeededCollection>(collection: S, locale: string, draft = false) =>
    (
      await payload.find({
        collection,
        pagination: false,
        limit: 0,
        depth: 0,
        locale: locale as never,
        overrideAccess: true,
        draft,
      })
    ).docs as unknown as Record_[];

  const topics = await all("topics", "en");
  const subtopics = await all("subtopics", "en");
  const indicators = await all("indicators", "en");

  // Counts
  const actual = {
    topics: topics.length,
    subtopics: subtopics.length,
    indicators: indicators.length,
  };
  lines.push(
    `counts: ${actual.topics} topics, ${actual.subtopics} subtopics, ${actual.indicators} indicators`,
  );
  for (const collection of SEEDED_COLLECTIONS) {
    if (actual[collection] !== expected[collection]) {
      problems.push(
        `${collection}: expected ${expected[collection]} from the dataset, found ${actual[collection]}`,
      );
    }
  }

  // Hierarchy
  const topicIds = new Set(topics.map((topic) => topic.id));
  const subtopicIds = new Set(subtopics.map((subtopic) => subtopic.id));

  for (const subtopic of subtopics) {
    const parent = refId((subtopic as { topic?: unknown }).topic);
    if (parent === undefined || !topicIds.has(parent)) {
      problems.push(`subtopic ${label(subtopic)} -> missing topic`);
    }
  }
  for (const indicator of indicators) {
    const parent = refId((indicator as { subtopic?: unknown }).subtopic);
    if (parent === undefined || !subtopicIds.has(parent)) {
      problems.push(`indicator ${label(indicator)} -> missing subtopic`);
    }
  }
  lines.push("hierarchy: every Subtopic under a Topic, every Indicator under a Subtopic");

  // Layout tiles resolve
  const indicatorIds = new Set(indicators.map((indicator) => indicator.id));
  const subtopicTopic = new Map(
    subtopics.map((subtopic) => [subtopic.id, refId((subtopic as { topic?: unknown }).topic)]),
  );
  const indicatorTopic = new Map(
    indicators.map((indicator) => [
      indicator.id,
      subtopicTopic.get(refId((indicator as { subtopic?: unknown }).subtopic)),
    ]),
  );

  let tiles = 0;
  for (const record of [...topics, ...subtopics]) {
    for (const entry of record.defaultLayout ?? []) {
      tiles += 1;
      const ref = refId(entry.indicator);
      if (ref === undefined || !indicatorIds.has(ref)) {
        problems.push(`layout of ${label(record)} -> missing indicator`);
      }
    }
  }
  lines.push(`layout tiles: ${tiles}, all resolving to real Indicators`);

  /*
   * *Geographic context* deliberately pulls Indicators from several other Topics,
   * and a prepare step that filtered layout entries to same-Topic Indicators would
   * silently flatten it. Checked as a property of the catalogue rather than of a
   * named record, since no record carries a stable number to look up any more.
   */
  const widestSpan = Math.max(
    0,
    ...topics.map(
      (topic) =>
        new Set(
          (topic.defaultLayout ?? []).map((entry) => indicatorTopic.get(refId(entry.indicator))),
        ).size,
    ),
  );
  lines.push(`widest Topic layout pulls Indicators from ${widestSpan} different Topics`);
  if (widestSpan < 2) problems.push("no Topic layout crosses Topic boundaries any more");

  // Every locale resolves a name, by translation or by fallback
  for (const locale of LOCALES) {
    const localised = await all("indicators", locale);
    const blank = localised.filter(
      (indicator) => !indicator.name || String(indicator.name).trim() === "",
    );
    lines.push(
      `locale ${locale}: ${localised.length} indicators, ${blank.length} with a blank name`,
    );
    if (blank.length) problems.push(`${locale} has ${blank.length} blank indicator name(s)`);
  }

  /*
   * Published, and keyed by uuid.
   *
   * Read the *published* view, not the draft view. A `draft: true` query returns
   * the draft version wherever one exists, which makes a published record with a
   * pending editorial edit indistinguishable from a record that was never
   * published — and only the second is a problem. Checking the draft view instead
   * fails every healthy database where somebody has unpublished changes in the
   * admin, which is a normal state and not this script's business.
   *
   * The uuid check guards against sliding back to numeric keys, which made the
   * record numbered 0 open in the admin as a blank create form.
   */
  for (const collection of SEEDED_COLLECTIONS) {
    const published = await all(collection, "en");
    const unpublished = published.filter(
      (doc) => (doc as { _status?: unknown })._status !== "published",
    );
    const notUuid = published.filter((doc) => typeof doc.id !== "string" || !UUID.test(doc.id));

    if (published.length !== expected[collection]) {
      problems.push(
        `${collection}: ${expected[collection] - published.length} record(s) not visible as published`,
      );
    }
    if (unpublished.length) {
      problems.push(`${collection}: ${unpublished.length} record(s) not published`);
    }
    if (notUuid.length) {
      problems.push(`${collection}: ${notUuid.length} record(s) not keyed by a uuid`);
    }

    // Reported, never a problem: someone is mid-edit in the admin.
    const pendingDrafts = (await all(collection, "en", true)).filter(
      (doc) => (doc as { _status?: unknown })._status !== "published",
    );
    if (pendingDrafts.length) {
      lines.push(
        `${collection}: ${pendingDrafts.length} record(s) with an unpublished draft revision (not a problem)`,
      );
    }
  }
  lines.push("every record published and keyed by a uuid");

  // An anonymous reader must see the whole catalogue
  const anonymous = await payload.find({
    collection: "indicators",
    pagination: false,
    limit: 0,
    overrideAccess: false,
    user: null,
  });
  lines.push(`anonymous read: ${anonymous.docs.length} indicators visible`);
  if (anonymous.docs.length !== expected.indicators) {
    problems.push(
      `anonymous read returned ${anonymous.docs.length} of ${expected.indicators} indicators`,
    );
  }

  return { lines, problems };
};
