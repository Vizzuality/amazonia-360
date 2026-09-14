/**
 * Country modules — the data scope a user is browsing in.
 *
 * Exactly one is active at all times and it lives in the URL path: a country is an
 * uppercase ISO 3166-1 alpha-3 code right after the locale, the Amazon Region is the path
 * with no code in it at all. `proxy.ts` strips the code before Next routes the request, so
 * the App Router's tree never contains it and no navigation ever crosses a module
 * boundary. See `.claude/adr/0001-country-in-the-url-path.md`.
 *
 * This module is the single source of truth for three questions: which codes are live,
 * what the picker shows, and which paths carry a module at all. Adding a country is a
 * change here plus its data — never a runtime toggle.
 */

export type Country = {
  /** ISO 3166-1 alpha-3, uppercase. Matches GADM `GID_0`, so it compares to real data. */
  code: string;
  /**
   * Whether it can be entered. A country is available once its data and indicators
   * exist — not before, or the module is an empty room.
   */
  available: boolean;
  nameKey: string;
};

export const COUNTRIES = [
  { code: "ECU", available: true, nameKey: "country-module-ECU-name" },
  { code: "BOL", available: false, nameKey: "country-module-BOL-name" },
  { code: "BRA", available: false, nameKey: "country-module-BRA-name" },
  { code: "COL", available: false, nameKey: "country-module-COL-name" },
  { code: "GUF", available: false, nameKey: "country-module-GUF-name" },
  { code: "GUY", available: false, nameKey: "country-module-GUY-name" },
  { code: "PER", available: false, nameKey: "country-module-PER-name" },
  { code: "SUR", available: false, nameKey: "country-module-SUR-name" },
  { code: "VEN", available: false, nameKey: "country-module-VEN-name" },
] as const satisfies readonly Country[];

/**
 * The codes a URL may carry. A configured-but-unavailable country is not one of them, so
 * `/en/SUR` is a not-found rather than an empty module.
 *
 * No code in this set may ever become the name of a first-level route: with the module
 * absent from the route tree, a three-letter first segment is the only thing that tells
 * `proxy.ts` a module was named.
 */
const LIVE_CODES: readonly string[] = COUNTRIES.filter((c) => c.available).map((c) => c.code);

/**
 * First path segments that never carry a module: a route carries one only where the
 * module changes what is shown, and "which country is this password reset in" has no
 * answer.
 */
const UNSCOPED_ROOTS: readonly string[] = ["auth", "private", "webshot"];

export function isCountryCode(value: string | undefined): boolean {
  return !!value && LIVE_CODES.includes(value);
}

export function countryFlagSrc(code: string): string {
  return `/images/flags/${code}.png`;
}

function segmentsOf(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** Whether a locale-relative path stays unprefixed whatever the module. */
export function isUnscopedPathname(pathname: string): boolean {
  const first = segmentsOf(pathname)[0];
  return !!first && UNSCOPED_ROOTS.includes(first);
}

/**
 * Prefixes a locale-relative path with a country, leaving unscoped paths alone. `null` is
 * the Amazon Region, which is the path as written.
 *
 * Idempotent on purpose: `Link` applies this to every href it is given, including hrefs
 * the picker has already resolved to another module, and a path that already names a
 * country keeps it.
 */
export function withCountry(pathname: string, country: string | null): string {
  if (!pathname.startsWith("/")) return pathname;
  if (country === null) return pathname;
  if (isUnscopedPathname(pathname)) return pathname;
  if (isCountryCode(segmentsOf(pathname)[0])) return pathname;
  return `/${country}${pathname === "/" ? "" : pathname}`;
}

/**
 * `withCountry` for the string and `{ pathname, query }` href shapes that next-intl's
 * `Link` and router accept.
 */
export function resolveCountryHref<Href>(href: Href, country: string | null): Href {
  if (typeof href === "string") {
    return withCountry(href, country) as Href;
  }

  if (href && typeof href === "object" && "pathname" in href) {
    const { pathname } = href as { pathname?: unknown };
    if (typeof pathname !== "string") return href;
    return { ...href, pathname: withCountry(pathname, country) };
  }

  return href;
}

/** Inverse of `withCountry`: the logical path, with any country code removed. */
export function stripCountry(pathname: string): string {
  const segments = segmentsOf(pathname);
  if (!isCountryCode(segments[0])) return pathname;
  return `/${segments.slice(1).join("/")}`;
}

/**
 * The module a locale-prefixed pathname names, or `null` for the Amazon Region.
 *
 * Reads the URL rather than the route param on purpose: the param does not exist, because
 * `proxy.ts` rewrites the code away before Next routes the request. `usePathname` reports
 * the URL the browser is on, not the rewrite's destination, so this is right after a
 * navigation, after a `popstate` and on a cold load alike.
 */
export function countryFromPathname(pathname: string, locales: readonly string[]): string | null {
  const segments = segmentsOf(pathname);
  const first = locales.includes(segments[0]) ? segments[1] : segments[0];
  return isCountryCode(first) ? first : null;
}

/**
 * The canonical pathname for a request, or `null` when it is already canonical.
 *
 * Paths are case-sensitive, so one case has to win: `ecu` is what a person types and
 * `ECU` is what the data speaks. Nothing else is rewritten — a path with no code in it is
 * the Amazon Region and is already canonical, which is why every URL minted before
 * modules existed still resolves.
 *
 * Returns `null` for paths without a locale prefix; the intl middleware adds one first.
 */
export function canonicalCountryPathname(
  pathname: string,
  locales: readonly string[],
): string | null {
  const segments = segmentsOf(pathname);
  const [locale, first, ...tail] = segments;

  if (!locales.includes(locale)) return null;
  if (first === undefined || isCountryCode(first)) return null;

  const upper = first.toUpperCase();
  if (upper !== first && isCountryCode(upper)) {
    return `/${[locale, upper, ...tail].join("/")}`;
  }

  return null;
}

/**
 * The path Next should route, with the module's code removed — or `null` when the URL
 * carries no code and routes as written.
 *
 * A three-letter segment that is not a live code is deliberately left in place: it matches
 * no route and falls into the catch-all that 404s, with the typed code still in the
 * address bar. Rewriting `/en/SUR` before 404ing would answer a question the reader did
 * not ask.
 */
export function routedPathname(pathname: string, locales: readonly string[]): string | null {
  const segments = segmentsOf(pathname);
  const [locale, first, ...tail] = segments;

  if (!locales.includes(locale)) return null;
  if (!isCountryCode(first)) return null;

  return `/${[locale, ...tail].join("/")}`;
}
