import { LOCALES } from "./types";

/**
 * Finds content problems that exist in the source today and that this transform
 * deliberately does not fix, because they are editorial judgements rather than
 * conversion concerns (AM-671). Reported so whoever signs off on the migration
 * gets the worklist instead of discovering them in production.
 */

type RawRecord = Record<string, unknown>;

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Translated text exists but English does not, so the fallback cannot help. */
export const findMissingEnglish = (records: RawRecord[], field: string): number[] =>
  records
    .filter((record) => {
      const en = text(record[`${field}_en`]).trim();
      const others = LOCALES.filter((locale) => locale !== "en").map((locale) =>
        text(record[`${field}_${locale}`]).trim(),
      );
      return en === "" && others.some((value) => value !== "");
    })
    .map((record) => Number(record.id));

/** Names with leading or trailing whitespace, which shows up in the UI. */
export const findUntrimmedNames = (records: RawRecord[]): string[] => {
  const issues: string[] = [];

  for (const record of records) {
    for (const locale of LOCALES) {
      const value = record[`name_${locale}`];
      if (typeof value !== "string" || value.trim() === "") continue;
      if (value !== value.trim()) {
        issues.push(`${record.id}:name_${locale} ${JSON.stringify(value)}`);
      }
    }
  }

  return issues;
};

/** ArcGIS substitution tokens containing whitespace resolve to nothing. */
export const findBrokenPopupTokens = (indicators: RawRecord[]): string[] => {
  const issues: string[] = [];

  for (const indicator of indicators) {
    const resource = (indicator.resource ?? {}) as RawRecord;
    const popup = (resource.popupTemplate ?? {}) as RawRecord;
    const title = text(popup.title);

    for (const token of title.match(/\{[^}]*\}/g) ?? []) {
      if (/\s/.test(token)) {
        issues.push(`indicator ${indicator.id} popup title token ${JSON.stringify(token)}`);
      }
    }
  }

  return issues;
};

/** Popup titles that are literal text rather than a field substitution. */
export const findLiteralPopupTitles = (indicators: RawRecord[]): string[] => {
  const issues: string[] = [];

  for (const indicator of indicators) {
    const resource = (indicator.resource ?? {}) as RawRecord;
    const popup = (resource.popupTemplate ?? {}) as RawRecord;
    const title = text(popup.title);

    if (title && !/^\{[^}]*\}$/.test(title)) {
      issues.push(
        `indicator ${indicator.id} popup title is literal text: ${JSON.stringify(title)}`,
      );
    }
  }

  return issues;
};

/** Legend labels that differ only by punctuation or spacing. */
export const findNearDuplicateLegendLabels = (indicators: RawRecord[]): string[] => {
  const labels = new Set<string>();

  for (const indicator of indicators) {
    const resource = (indicator.resource ?? {}) as RawRecord;
    const legend = resource.legend as { items?: unknown } | undefined;
    const items = Array.isArray(legend?.items) ? legend.items : [];

    for (const item of items) {
      const label = text((item as RawRecord).label);
      if (label) labels.add(label);
    }
  }

  const normalise = (label: string) => label.replace(/[\s-]/g, "").toLowerCase();
  const issues: string[] = [];
  const all = [...labels];

  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) {
      if (normalise(all[i]) === normalise(all[j])) {
        issues.push(`legend labels ${JSON.stringify(all[i])} and ${JSON.stringify(all[j])}`);
      }
    }
  }

  return issues;
};

export const auditContent = ({
  topics,
  subtopics,
  indicators,
}: {
  topics: RawRecord[];
  subtopics: RawRecord[];
  indicators: RawRecord[];
}): string[] => {
  const issues: string[] = [];

  const missingEnglish = findMissingEnglish(indicators, "description");
  if (missingEnglish.length) {
    issues.push(
      `Indicators ${missingEnglish.join(", ")} have translated descriptions but no English one, so English readers see a blank and the fallback cannot help`,
    );
  }

  for (const label of [
    ...findUntrimmedNames(topics).map((issue) => `Topic ${issue}`),
    ...findUntrimmedNames(subtopics).map((issue) => `Subtopic ${issue}`),
    ...findUntrimmedNames(indicators).map((issue) => `Indicator ${issue}`),
  ]) {
    issues.push(`Untrimmed name: ${label}`);
  }

  issues.push(...findBrokenPopupTokens(indicators).map((issue) => `Substitutes nothing: ${issue}`));
  issues.push(
    ...findLiteralPopupTitles(indicators).map((issue) => `Not translatable today: ${issue}`),
  );
  issues.push(
    ...findNearDuplicateLegendLabels(indicators).map(
      (issue) => `Should be reconciled to one: ${issue}`,
    ),
  );

  return issues;
};
