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

async function main() {
  const payload = await getPayload({ config });

  const topics = TOPICS as RawTopic[];
  const subtopics = SUBTOPICS as RawSubtopic[];
  const indicators = INDICATORS as RawIndicator[];

  await seedTopics(payload, topics);
  await seedSubtopics(payload, subtopics);
  await seedIndicators(payload, indicators);
  await seedDefaultVisualizations(payload, topics, subtopics);

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
