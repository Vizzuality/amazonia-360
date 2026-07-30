import { DEFAULT_LOCALE, LOCALES } from "./types";
import type { Locale, Localized } from "./types";

/**
 * Sparse translations.
 *
 * A translation is written only when it is non-empty and actually differs from
 * English; otherwise the locale is left unset so Payload falls back. This keeps
 * the data honest about what has genuinely been translated instead of copying
 * English into every locale and making untranslated content indistinguishable
 * from translated content.
 */

type BySuffix = Record<string, unknown>;

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Reads `<field>_en` / `_es` / `_pt` off a source record and returns a sparse
 * localized value, or undefined when there is no English content and nothing to
 * fall back to.
 */
export const localizeText = (source: BySuffix, field: string): Localized<string> | undefined => {
  const en = asText(source[`${field}_${DEFAULT_LOCALE}`]);
  const result = { en } as Localized<string>;

  let hasAny = en !== "";

  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;

    const value = asText(source[`${field}_${locale}`]);
    if (value !== "" && value !== en) {
      result[locale as Exclude<Locale, "en">] = value;
      hasAny = true;
    }
  }

  return hasAny ? result : undefined;
};

/** The raw per-locale strings for a field, for callers that convert before storing. */
export const readLocaleTexts = (source: BySuffix, field: string): Record<Locale, string> =>
  LOCALES.reduce(
    (acc, locale) => {
      acc[locale] = asText(source[`${field}_${locale}`]);
      return acc;
    },
    {} as Record<Locale, string>,
  );

/**
 * Builds a sparse localized value from already-converted per-locale values,
 * using the raw source text to decide what counts as a duplicate of English.
 * Rich text cannot be compared directly — two conversions of the same markdown
 * are equal, but comparing large trees is wasteful and fragile — so the
 * decision is made on the source strings that produced them.
 */
export const localizeConverted = <T>({
  sourceTexts,
  convert,
}: {
  sourceTexts: Record<Locale, string>;
  convert: (text: string, locale: Locale) => T;
}): Localized<T> | undefined => {
  const en = sourceTexts[DEFAULT_LOCALE];

  if (en === "" && LOCALES.every((locale) => sourceTexts[locale] === "")) {
    return undefined;
  }

  const result = { en: convert(en, DEFAULT_LOCALE) } as Localized<T>;

  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;

    const value = sourceTexts[locale];
    if (value !== "" && value !== en) {
      result[locale as Exclude<Locale, "en">] = convert(value, locale);
    }
  }

  return result;
};

/** Seeds a translatable value with English only. Used for legend and popup labels. */
export const seedEnglish = (value: string): Localized<string> => ({ en: value });
