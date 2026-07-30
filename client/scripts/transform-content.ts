/**
 * Turns the three static JSON files into one reviewable CMS-ready dataset plus
 * a fidelity report (AM-667).
 *
 * Run with `pnpm transform-content`.
 *
 * Deliberately offline and separate from any deploy step. This is partly a
 * content-cleanup job, not a pure data move: some source descriptions are
 * malformed and do not survive conversion untouched. If the conversion happened
 * during deployment nobody would ever see what it did, so instead it writes its
 * output for a person to read and sign off on.
 *
 * Exits non-zero if any description would lose a hyperlink, which is the one
 * failure this must never let through.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { auditContent } from "../src/lib/content-transform/audit";
import { buildDataset } from "../src/lib/content-transform/dataset";
import { renderFidelityReport } from "../src/lib/content-transform/fidelity";
import { createTestEditorConfig } from "../src/lib/content-transform/test-support";

const ROOT = process.cwd();
const SOURCE = path.resolve(ROOT, "datum");
const OUT_DIR = path.resolve(ROOT, "datum", "cms");

const read = (name: string) => JSON.parse(readFileSync(path.resolve(SOURCE, name), "utf8"));

const main = async () => {
  const topics = read("topics.json");
  const subtopics = read("subtopics.json");
  const indicators = read("indicators.json");

  const editorConfig = await createTestEditorConfig();

  const { dataset, findings, droppedLayoutEntries } = buildDataset({
    topics,
    subtopics,
    indicators,
    editorConfig,
  });

  // A layout whose every tile was dead ends up empty. Worth calling out rather
  // than leaving someone to notice a blank Subtopic later.
  const hadSourceLayout = (record: { default_visualization?: unknown }) =>
    Array.isArray(record.default_visualization) && record.default_visualization.length > 0;

  const emptiedLayouts = [
    ...dataset.topics
      .filter((topic, index) => !topic.defaultLayout.length && hadSourceLayout(topics[index]))
      .map((topic) => `Topic ${topic.id}`),
    ...dataset.subtopics
      .filter(
        (subtopic, index) => !subtopic.defaultLayout.length && hadSourceLayout(subtopics[index]),
      )
      .map((subtopic) => `Subtopic ${subtopic.id}`),
  ];

  const report = renderFidelityReport(findings, {
    counts: {
      topics: dataset.topics.length,
      subtopics: dataset.subtopics.length,
      indicators: dataset.indicators.length,
    },
    droppedLayoutEntries,
    emptiedLayouts,
    knownContentIssues: auditContent({ topics, subtopics, indicators }),
  });

  mkdirSync(OUT_DIR, { recursive: true });
  // Written compact: rich-text JSON is verbose enough that pretty-printing more
  // than doubles the file for no gain — a 3 MB diff is not read either way. The
  // review artefact is the fidelity report; inspect the data with `jq`.
  writeFileSync(path.resolve(OUT_DIR, "content.json"), `${JSON.stringify(dataset)}\n`, "utf8");
  writeFileSync(path.resolve(OUT_DIR, "fidelity-report.md"), report, "utf8");

  const linksLost = findings.filter((finding) =>
    finding.issues.some((issue) => issue.kind === "links-lost"),
  );

  console.log(
    `Wrote ${dataset.topics.length} topics, ${dataset.subtopics.length} subtopics, ${dataset.indicators.length} indicators to datum/cms/content.json`,
  );
  console.log(
    `Fidelity report: ${findings.length} field(s) to review → datum/cms/fidelity-report.md`,
  );
  console.log(`Dropped layout entries: ${droppedLayoutEntries.length}`);

  if (linksLost.length) {
    console.error(
      `\n${linksLost.length} description(s) lost a hyperlink. This must be fixed before loading:`,
    );
    for (const finding of linksLost) {
      const urls = finding.issues.flatMap((issue) =>
        issue.kind === "links-lost" ? issue.urls : [],
      );
      console.error(`  ${finding.where}: ${urls.join(", ")}`);
    }
    process.exit(1);
  }

  console.log("No description lost a hyperlink.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
