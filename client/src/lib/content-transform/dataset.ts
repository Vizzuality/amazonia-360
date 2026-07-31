import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical";

import { toDataSource } from "./data-source";
import { compareFidelity } from "./fidelity";
import type { FidelityFinding } from "./fidelity";
import { toLayout } from "./layout";
import type { DroppedLayoutEntry } from "./layout";
import { localizeConverted, localizeText, readLocaleTexts } from "./localize";
import { markdownToRichText } from "./markdown";
import type { RichText } from "./markdown";
import { isVisualizationType } from "./types";
import type {
  ContentDataset,
  IndicatorRecord,
  Localized,
  SubtopicRecord,
  TopicRecord,
} from "./types";

/**
 * Builds the CMS-ready dataset from the three source JSON files.
 *
 * Obsolete fields are dropped rather than carried across: the `Numerotation`
 * numbering column, the `Active` flag (which is 1 on every row), the duplicated
 * layout entry ids, and the Subtopic `image` field, which is empty everywhere
 * and unused by the app.
 */

type RawRecord = Record<string, unknown>;

export type BuildResult = {
  dataset: ContentDataset;
  findings: FidelityFinding[];
  droppedLayoutEntries: DroppedLayoutEntry[];
};

const num = (value: unknown): number => (typeof value === "number" ? value : Number(value) || 0);

export const buildDataset = ({
  topics,
  subtopics,
  indicators,
  editorConfig,
}: {
  topics: RawRecord[];
  subtopics: RawRecord[];
  indicators: RawRecord[];
  editorConfig: SanitizedServerEditorConfig;
}): BuildResult => {
  const findings: FidelityFinding[] = [];
  const droppedLayoutEntries: DroppedLayoutEntry[] = [];
  const knownIndicatorIds = new Set(indicators.map((indicator) => num(indicator.id)));

  /**
   * Converts a description to rich text per locale and records any field whose
   * appearance changes on the way.
   */
  const describeRichText = (source: RawRecord, label: string): Localized<RichText> | undefined => {
    const sourceTexts = readLocaleTexts(source, "description");

    return localizeConverted<RichText>({
      sourceTexts,
      convert: (markdown, locale) => {
        const scope = `${label}:description:${locale}`;
        const richText = markdownToRichText({ editorConfig, markdown, scope });

        const finding = compareFidelity({
          where: `${label} description_${locale}`,
          markdown,
          richText,
        });
        if (finding) findings.push(finding);

        return richText;
      },
    });
  };

  const builtTopics: TopicRecord[] = topics.map((topic) => {
    const id = num(topic.id);
    const name = localizeText(topic, "name");
    const description = describeRichText(topic, `topic ${id}`);

    return {
      id,
      _status: "published",
      name: name ?? { en: "" },
      ...(description ? { description } : {}),
      defaultLayout: toLayout({
        entries: topic.default_visualization,
        knownIndicatorIds,
        owner: `Topic ${id}`,
        dropped: droppedLayoutEntries,
      }),
    };
  });

  const builtSubtopics: SubtopicRecord[] = subtopics.map((subtopic) => {
    const id = num(subtopic.id);
    const name = localizeText(subtopic, "name");
    const description = describeRichText(subtopic, `subtopic ${id}`);

    return {
      id,
      _status: "published",
      topic: num(subtopic.topic_id),
      name: name ?? { en: "" },
      ...(description ? { description } : {}),
      defaultLayout: toLayout({
        entries: subtopic.default_visualization,
        knownIndicatorIds,
        owner: `Subtopic ${id}`,
        dropped: droppedLayoutEntries,
      }),
    };
  });

  const builtIndicators: IndicatorRecord[] = indicators.map((indicator) => {
    const id = num(indicator.id);
    const name = localizeText(indicator, "name");
    const descriptionShort = localizeText(indicator, "description_short");
    const unit = localizeText(indicator, "unit");
    const description = describeRichText(indicator, `indicator ${id}`);

    return {
      id,
      _status: "published",
      subtopic: num(indicator.subtopic_id),
      order: num(indicator.order),
      name: name ?? { en: "" },
      ...(description ? { description } : {}),
      ...(descriptionShort ? { descriptionShort } : {}),
      ...(unit ? { unit } : {}),
      visualizationTypes: (Array.isArray(indicator.visualization_types)
        ? indicator.visualization_types
        : []
      ).map((type) => {
        if (!isVisualizationType(type)) {
          throw new Error(`Indicator ${id} has an unknown visualization type: ${JSON.stringify(type)}`);
        }
        return type;
      }),
      dataSource: toDataSource(indicator.resource),
    };
  });

  return {
    dataset: {
      topics: builtTopics,
      subtopics: builtSubtopics,
      indicators: builtIndicators,
    },
    findings,
    droppedLayoutEntries,
  };
};
