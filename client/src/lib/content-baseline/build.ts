import { getIndicators } from "@/lib/indicators";
import { getSubtopics } from "@/lib/subtopics";
import { getTopics } from "@/lib/topics";

import { BASELINE_LOCALES, digestLocale, digestStructure } from "./digest";
import type { BaselineLocale, ContentBaseline, LocaleDigest } from "./digest";

/**
 * Runs the three live content lookups across every locale and reduces the
 * result to a baseline digest. The assertion test compares this against the
 * committed fixture; nothing else should depend on it.
 */
export const buildContentBaseline = async (): Promise<ContentBaseline> => {
  const perLocale = await Promise.all(
    BASELINE_LOCALES.map(async (locale) => {
      const [topics, subtopics, indicators] = await Promise.all([
        getTopics({ locale }),
        getSubtopics({ locale }),
        getIndicators(locale),
      ]);
      return { locale, topics, subtopics, indicators };
    }),
  );

  const english = perLocale.find((entry) => entry.locale === "en");

  if (!english) {
    throw new Error("Baseline requires the English locale");
  }

  return {
    counts: {
      topics: english.topics.length,
      subtopics: english.subtopics.length,
      indicators: english.indicators.length,
    },
    structure: digestStructure(english.topics, english.subtopics, english.indicators),
    locales: perLocale.reduce(
      (acc, { locale, topics, subtopics, indicators }) => {
        acc[locale] = digestLocale(topics, subtopics, indicators);
        return acc;
      },
      {} as Record<BaselineLocale, LocaleDigest>,
    ),
  };
};
