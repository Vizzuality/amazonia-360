import { getPayload } from "payload";

import config from "@payload-config";

import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";

import { seedDefaultVisualizations } from "./seed-default-visualizations";
import { seedIndicators } from "./seed-indicators";
import { seedSubtopics } from "./seed-subtopics";
import { seedTopics } from "./seed-topics";
import type { RawIndicator, RawSubtopic, RawTopic } from "./utils/types";

const FORCE = process.env.SEED_FORCE === "true";

async function main() {
  const payload = await getPayload({ config });

  const [topics, subtopics, indicators] = await Promise.all([
    payload.count({ collection: "topics" }),
    payload.count({ collection: "subtopics" }),
    payload.count({ collection: "indicators" }),
  ]);
  const alreadySeeded = topics.totalDocs > 0 || subtopics.totalDocs > 0 || indicators.totalDocs > 0;

  if (alreadySeeded && !FORCE) {
    payload.logger.error("Catalogue already has data. Set SEED_FORCE=true to wipe and reseed.");
    process.exit(1);
  }

  if (alreadySeeded && FORCE) {
    const deleteAll = { where: { id: { exists: true as const } } };
    await payload.delete({ collection: "indicators", ...deleteAll });
    await payload.delete({ collection: "subtopics", ...deleteAll });
    await payload.delete({ collection: "topics", ...deleteAll });
  }

  const rawTopics = TOPICS as RawTopic[];
  const rawSubtopics = SUBTOPICS as RawSubtopic[];
  const rawIndicators = INDICATORS as RawIndicator[];

  await seedTopics(payload, rawTopics);
  await seedSubtopics(payload, rawSubtopics);
  await seedIndicators(payload, rawIndicators);
  await seedDefaultVisualizations(payload, rawTopics, rawSubtopics);

  const [seededTopics, seededSubtopics, seededIndicators] = await Promise.all([
    payload.count({ collection: "topics" }),
    payload.count({ collection: "subtopics" }),
    payload.count({ collection: "indicators" }),
  ]);
  payload.logger.info(
    `Seeded ${seededTopics.totalDocs} topics, ${seededSubtopics.totalDocs} subtopics, ${seededIndicators.totalDocs} indicators.`,
  );
  process.exit(0);
}

await main();
