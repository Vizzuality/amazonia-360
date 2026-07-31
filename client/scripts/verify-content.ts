/**
 * Checks a loaded database looks right (AM-669).
 *
 * Run with `pnpm verify-content` after `pnpm load-content`, and again on
 * staging or production once the content has been loaded there. Exits non-zero
 * on any problem.
 *
 * Covers the things that fail quietly: wrong counts, a broken hierarchy, layout
 * tiles pointing at Indicators that no longer exist, the overview Topic losing
 * its deliberate cross-Topic references, a locale resolving to a blank name,
 * and content being invisible to an anonymous reader.
 */
import { getPayload } from "payload";

import config from "@payload-config";

const main = async () => {
  const payload = await getPayload({ config });
  const problems: string[] = [];

  const all = async <S extends "topics" | "subtopics" | "indicators">(
    collection: S,
    locale: string,
  ) =>
    (
      await payload.find({
        collection,
        pagination: false,
        limit: 0,
        depth: 0,
        locale: locale as never,
        overrideAccess: true,
      })
    ).docs;

  const topics = await all("topics", "en");
  const subtopics = await all("subtopics", "en");
  const indicators = await all("indicators", "en");

  console.log(
    `counts: ${topics.length} topics, ${subtopics.length} subtopics, ${indicators.length} indicators`,
  );
  if (topics.length !== 9 || subtopics.length !== 28 || indicators.length !== 164) {
    problems.push("unexpected counts");
  }

  // Hierarchy
  const topicIds = new Set(topics.map((t) => t.id));
  const subtopicIds = new Set(subtopics.map((s) => s.id));

  for (const subtopic of subtopics) {
    const parent = typeof subtopic.topic === "object" ? subtopic.topic?.id : subtopic.topic;
    if (!topicIds.has(parent as number))
      problems.push(`subtopic ${subtopic.id} -> missing topic ${parent}`);
  }
  for (const indicator of indicators) {
    const parent =
      typeof indicator.subtopic === "object" ? indicator.subtopic?.id : indicator.subtopic;
    if (!subtopicIds.has(parent as number)) {
      problems.push(`indicator ${indicator.id} -> missing subtopic ${parent}`);
    }
  }
  console.log("hierarchy: every Subtopic under a Topic, every Indicator under a Subtopic");

  // Layouts resolve
  const indicatorIds = new Set(indicators.map((i) => i.id));
  const subtopicTopic = new Map(
    subtopics.map((s) => [s.id, typeof s.topic === "object" ? s.topic?.id : s.topic]),
  );
  const indicatorTopic = new Map(
    indicators.map((i) => [
      i.id,
      subtopicTopic.get((typeof i.subtopic === "object" ? i.subtopic?.id : i.subtopic) as number),
    ]),
  );

  type LayoutOwner = { id: number; defaultLayout?: { indicator?: unknown }[] | null };
  const layoutRef = (entry: { indicator?: unknown }) =>
    (typeof entry.indicator === "object" && entry.indicator !== null
      ? (entry.indicator as { id?: number }).id
      : entry.indicator) as number;

  let tiles = 0;
  for (const record of [...topics, ...subtopics] as unknown as LayoutOwner[]) {
    for (const entry of record.defaultLayout ?? []) {
      tiles += 1;
      const ref = layoutRef(entry);
      if (!indicatorIds.has(ref)) {
        problems.push(`layout of ${record.id} -> missing indicator ${ref}`);
      }
    }
  }
  console.log(`layout tiles: ${tiles}, all resolving to real Indicators`);

  // Cross-topic references in the overview Topic
  const overview = (topics as unknown as LayoutOwner[]).find((t) => t.id === 0);
  const overviewTopics = new Set(
    (overview?.defaultLayout ?? []).map((entry) => indicatorTopic.get(layoutRef(entry))),
  );
  console.log(`overview Topic pulls Indicators from ${overviewTopics.size} different Topics`);
  if (overviewTopics.size < 2) problems.push("overview Topic lost its cross-topic references");

  // Locale coverage
  for (const locale of ["en", "es", "pt"]) {
    const localised = await all("indicators", locale);
    const blank = localised.filter((i) => !i.name || String(i.name).trim() === "");
    console.log(
      `locale ${locale}: ${localised.length} indicators, ${blank.length} with a blank name`,
    );
    if (blank.length) problems.push(`${locale} has ${blank.length} blank indicator names`);
  }

  // Spot-check a translation and a fallback
  const [es] = (
    await payload.find({
      collection: "indicators",
      where: { id: { equals: 0 } },
      locale: "es",
      overrideAccess: true,
    })
  ).docs;
  console.log(`indicator 0 in es: ${JSON.stringify(es?.name)} (expected the Spanish translation)`);

  const [ptFallback] = (
    await payload.find({
      collection: "subtopics",
      where: { id: { equals: 0 } },
      locale: "pt",
      overrideAccess: true,
    })
  ).docs;
  console.log(
    `subtopic 0 in pt: ${JSON.stringify(ptFallback?.name)} (expected the English fallback)`,
  );

  // Anonymous read sees everything, because it is all published
  const anonymous = await payload.find({
    collection: "indicators",
    pagination: false,
    limit: 0,
    overrideAccess: false,
    user: null,
  });
  console.log(`anonymous read: ${anonymous.docs.length} indicators visible`);
  if (anonymous.docs.length !== 164) problems.push("anonymous read did not return all 164");

  console.log(problems.length ? `\nPROBLEMS:\n  ${problems.join("\n  ")}` : "\nAll checks passed.");
  process.exit(problems.length ? 1 : 0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
