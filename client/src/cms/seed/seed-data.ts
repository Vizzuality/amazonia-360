import { getPayload } from "payload";

import config from "@payload-config";

import INDICATORS_ECU from "@/../datum/indicators.ECU.json";
import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";

import { seedDefaultVisualizations } from "./seed-default-visualizations";
import { seedIndicators } from "./seed-indicators";
import { seedSubtopics } from "./seed-subtopics";
import { seedTopics } from "./seed-topics";
import type { RawIndicator, RawSubtopic, RawTopic } from "./utils/types";

async function main() {
  const payload = await getPayload({ config });

  const topics = TOPICS as RawTopic[];
  const subtopics = SUBTOPICS as RawSubtopic[];
  // Regional rows first: a country row's `replaces` can only be written once its target is in.
  const indicators = [...INDICATORS, ...INDICATORS_ECU] as RawIndicator[];

  await seedTopics(payload, topics);
  await seedSubtopics(payload, subtopics);
  await seedIndicators(payload, indicators);
  await seedDefaultVisualizations(payload, topics);

  const [seededTopics, seededSubtopics, seededIndicators] = await Promise.all([
    payload.count({ collection: "topics" }),
    payload.count({ collection: "subtopics" }),
    payload.count({ collection: "indicators" }),
  ]);
  // Exiting 0 on a short seed leaves `migrate && seed:data && build && start` to serve an
  // incomplete catalogue, and the failure surfaces much later as unrelated e2e specs.
  const counted = [
    ["topics", seededTopics.totalDocs, topics.length],
    ["subtopics", seededSubtopics.totalDocs, subtopics.length],
    ["indicators", seededIndicators.totalDocs, indicators.length],
  ] as const;
  const short = counted.filter(([, seeded, source]) => seeded !== source);

  if (short.length) {
    const shortfall = short
      .map(([name, seeded, source]) => `${seeded} of ${source} ${name}`)
      .join(", ");

    payload.logger.error(`Seed incomplete: ${shortfall}.`);
    process.exit(1);
  }

  payload.logger.info(
    `Seeded ${seededTopics.totalDocs} topics, ${seededSubtopics.totalDocs} subtopics, ${seededIndicators.totalDocs} indicators.`,
  );
  process.exit(0);
}

await main();
