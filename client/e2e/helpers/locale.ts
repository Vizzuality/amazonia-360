/** Supported locales matching the next-intl routing config. */
export const LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

/** Returns the URL path prefix for a given locale (e.g. "/en"). */
export function localePath(locale: Locale): string {
  return `/${locale}`;
}
