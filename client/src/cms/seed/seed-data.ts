import { getPayload } from "payload";

import config from "@payload-config";

import INDICATORS_ECU from "@/../datum/indicators.ECU.json";
import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";

import { seedDefaultVisualizations } from "./seed-default-visualizations";
import { seedIndicators } from "./seed-indicators";
import { DEFAULT_PREVIEW_USERS_PASSWORD, seedPreviewUsers } from "./seed-preview-users";
import { seedSubtopics } from "./seed-subtopics";
import { seedTopics } from "./seed-topics";
import type { RawIndicator, RawSubtopic, RawTopic } from "./utils/types";

const PREVIEW_USER_EMAILS: readonly string[] = [
  "miguel.barrenechea@vizzuality.com",
  "laura.riera@vizzuality.com",
  "miguel.toyas@vizzuality.com",
];

const PREVIEW = process.env.SEED_PREVIEW === "true";

async function main() {
  const payload = await getPayload({ config });

  const topics = TOPICS as RawTopic[];
  const subtopics = SUBTOPICS as RawSubtopic[];
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
  // Exiting 0 on a short seed leaves `db:migrate && db:seed && build && start` to serve an
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

  let preview = "";
  if (PREVIEW) {
    if (!process.env.PREVIEW_USERS_PASSWORD) {
      payload.logger.warn(
        "PREVIEW_USERS_PASSWORD is not set. The preview accounts use the default password.",
      );
    }
    await seedPreviewUsers(
      payload,
      PREVIEW_USER_EMAILS,
      process.env.PREVIEW_USERS_PASSWORD || DEFAULT_PREVIEW_USERS_PASSWORD,
    );
    const count = PREVIEW_USER_EMAILS.length;
    preview = ` and ${count} preview admins and ${count} preview users`;
  }
  payload.logger.info(
    `Seeded ${seededTopics.totalDocs} topics, ${seededSubtopics.totalDocs} subtopics, ${seededIndicators.totalDocs} indicators${preview}.`,
  );
  process.exit(0);
}

await main();
