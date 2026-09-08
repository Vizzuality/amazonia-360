/**
 * Country modules — the data scope a user is browsing in.
 *
 * Exactly one is active at all times and it lives in the URL path, right after the
 * locale: `~` for the Amazon Region, an uppercase ISO 3166-1 alpha-3 code for a country.
 * See `.claude/adr/0001-country-in-the-url-path.md`.
 *
 * This module is the single source of truth for three questions: which segments are
 * valid, what the picker shows, and which paths carry a country at all. Adding a country
 * is a change here plus its data — never a runtime toggle.
 */

/** Sentinel for the Amazon Region: regional data, no country scope. */
export const AMAZON_REGION = "~";

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
  {
    code: "ECU",
    available: true,
    nameKey: "country-module-ECU-name",
  },
  {
    code: "BOL",
    available: false,
    nameKey: "country-module-BOL-name",
  },
  {
    code: "BRA",
    available: false,
    nameKey: "country-module-BRA-name",
  },
  {
    code: "COL",
    available: false,
    nameKey: "country-module-COL-name",
  },
  {
    code: "GUF",
    available: false,
    nameKey: "country-module-GUF-name",
  },
  {
    code: "GUY",
    available: false,
    nameKey: "country-module-GUY-name",
  },
  {
    code: "PER",
    available: false,
    nameKey: "country-module-PER-name",
  },
  {
    code: "SUR",
    available: false,
    nameKey: "country-module-SUR-name",
  },
  {
    code: "VEN",
    available: false,
    nameKey: "country-module-VEN-name",
  },
] as const satisfies readonly Country[];

const AVAILABLE_COUNTRIES = COUNTRIES.filter((c) => c.available);

/** Every valid `[country]` param value. Anything else is a not-found. */
const COUNTRY_SEGMENTS: readonly string[] = [
  AMAZON_REGION,
  ...AVAILABLE_COUNTRIES.map((c) => c.code),
];

/**
 * First path segments that never carry a country: a route is scoped only where the
 * country changes what is shown, and "which country is this password reset in" has no
 * answer. Static segments beat the dynamic one, so these resolve unprefixed.
 */
const UNSCOPED_ROOTS: readonly string[] = ["auth", "private", "webshot"];

export function isCountrySegment(value: string | undefined): boolean {
  return !!value && COUNTRY_SEGMENTS.includes(value);
}

/**
 * Static params for the route-group layouts below `[country]`: locale × live country.
 * Coming-soon countries are left out so we never pre-render a not-found.
 */
export function countryStaticParams(locales: readonly string[]) {
  return locales.flatMap((locale) => COUNTRY_SEGMENTS.map((country) => ({ locale, country })));
}

export function countryFlagSrc(code: string): string {
  return `/images/flags/${code}.png`;
}

function segmentsOf(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** Whether a locale-relative path stays unprefixed. */
export function isUnscopedPathname(pathname: string): boolean {
  const first = segmentsOf(pathname)[0];
  return !!first && UNSCOPED_ROOTS.includes(first);
}

/**
 * Prefixes a locale-relative path with a country, leaving unscoped paths alone.
 * Idempotent: a path that already names a country keeps it, which is what lets the
 * picker build links to *other* countries and still hand them to `Link`.
 */
export function withCountry(pathname: string, country: string): string {
  if (!pathname.startsWith("/")) return pathname;
  if (isUnscopedPathname(pathname)) return pathname;
  if (isCountrySegment(segmentsOf(pathname)[0])) return pathname;
  return pathname === "/" ? `/${country}` : `/${country}${pathname}`;
}

/**
 * `withCountry` for the string and `{ pathname, query }` href shapes that next-intl's
 * `Link` and router accept.
 */
export function resolveCountryHref<Href>(href: Href, country: string): Href {
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

/** Inverse of `withCountry`: the logical path, with any country segment removed. */
export function stripCountry(pathname: string): string {
  const segments = segmentsOf(pathname);
  if (!isCountrySegment(segments[0])) return pathname;
  return `/${segments.slice(1).join("/")}`;
}

const COUNTRY_SHAPED = /^[A-Za-z]{3}$/;

/**
 * The canonical pathname for a request, or `null` when it is already canonical.
 *
 * A lowercase live code is redirected to uppercase, because `ecu` is what a person
 * types. Anything else gets `~` inserted — the legacy redirect that keeps printed QR
 * codes working forever.
 *
 * The one deviation from that pair: any three-letter segment is passed through so the
 * route can produce a not-found with the typed code still in the address bar. Rewriting
 * `/en/SUR` to `/en/~/SUR` before 404ing would answer a question the reader did not ask.
 *
 * Returns `null` for paths without a locale prefix — the intl middleware adds one first.
 */
export function canonicalCountryPathname(
  pathname: string,
  locales: readonly string[],
): string | null {
  const segments = segmentsOf(pathname);
  const [locale, ...rest] = segments;

  if (!locales.includes(locale)) return null;

  const [first, ...tail] = rest;

  if (first === undefined) return `/${locale}/${AMAZON_REGION}`;
  if (isCountrySegment(first)) return null;

  const upper = first.toUpperCase();
  if (isCountrySegment(upper)) return `/${[locale, upper, ...tail].join("/")}`;

  if (UNSCOPED_ROOTS.includes(first)) return null;
  if (COUNTRY_SHAPED.test(first)) return null;

  return `/${[locale, AMAZON_REGION, ...rest].join("/")}`;
}
