/** Supported locales matching the next-intl routing config. */
export const LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

/** Sentinel for the Amazon Region, matching `AMAZON_REGION` in the app. */
export const AMAZON_REGION = "~";

/** Returns the URL path prefix for a given locale (e.g. "/en"). */
export function localePath(locale: Locale): string {
  return `/${locale}`;
}

/**
 * Returns the URL path prefix for a locale and a country (e.g. "/en/~"). Every spec
 * builds data-route URLs from here so the country segment lives in one place.
 */
export function countryPath(locale: Locale = "en", country: string = AMAZON_REGION): string {
  return `${localePath(locale)}/${country}`;
}
