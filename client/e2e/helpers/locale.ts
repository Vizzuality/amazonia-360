/** Supported locales matching the next-intl routing config. */
export const LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

/** Returns the URL path prefix for a given locale (e.g. "/en"). */
export function localePath(locale: Locale): string {
  return `/${locale}`;
}

/**
 * The URL path prefix for a locale and a country module. The Amazon Region has no code of
 * its own — it is the path with nothing between the locale and the route — so `country` is
 * omitted for it.
 */
export function countryPath(locale: Locale = "en", country?: string): string {
  return country ? `${localePath(locale)}/${country}` : localePath(locale);
}
