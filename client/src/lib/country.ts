export type Country = {
  /** ISO 3166-1 alpha-3, uppercase. Matches GADM `GID_0`, so it compares to real data. */
  code: string;
  available: boolean;
  nameKey: string;
};

// Also the source of the `enum_indicators_country` Postgres enums: a new code needs a Payload
// migration before an indicator can be saved or seeded against it.
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

// No code in this set may ever become the name of a first-level route: with the module
// absent from the route tree, a three-letter first segment is the only thing that tells
// `proxy.ts` a module was named.
const LIVE_CODES: ReadonlySet<string> = new Set(
  COUNTRIES.filter((c) => c.available).map((c) => c.code),
);

const UNSCOPED_ROOTS: ReadonlySet<string> = new Set(["auth", "private", "webshot"]);

export function isCountryCode(value: string | undefined): boolean {
  return !!value && LIVE_CODES.has(value);
}

export function countryFlagSrc(code: string): string {
  return `/images/flags/${code}.png`;
}

function segmentsOf(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

export function isUnscopedPathname(pathname: string): boolean {
  const first = segmentsOf(pathname)[0];
  return !!first && UNSCOPED_ROOTS.has(first);
}

// Idempotent on purpose: `Link` applies this to every href it is given, including hrefs
// the picker has already resolved to another module.
export function withCountry(pathname: string, country: string | null): string {
  if (!pathname.startsWith("/")) return pathname;
  if (country === null) return pathname;
  if (isUnscopedPathname(pathname)) return pathname;
  if (isCountryCode(segmentsOf(pathname)[0])) return pathname;
  return `/${country}${pathname === "/" ? "" : pathname}`;
}

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

export function stripCountry(pathname: string): string {
  const segments = segmentsOf(pathname);
  if (!isCountryCode(segments[0])) return pathname;
  return `/${segments.slice(1).join("/")}`;
}

// Reads the URL, not the route param: the param does not exist, because `proxy.ts`
// rewrites the code away before Next routes the request.
export function countryFromPathname(pathname: string, locales: readonly string[]): string | null {
  const segments = segmentsOf(pathname);
  const first = locales.includes(segments[0]) ? segments[1] : segments[0];
  return isCountryCode(first) ? first : null;
}

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

// A three-letter segment that is not a live code is left in place on purpose: it matches
// no route and falls into the catch-all that 404s, with the typed code still in the bar.
export function routedPathname(pathname: string, locales: readonly string[]): string | null {
  const segments = segmentsOf(pathname);
  const [locale, first, ...tail] = segments;

  if (!locales.includes(locale)) return null;
  if (!isCountryCode(first)) return null;

  return `/${[locale, ...tail].join("/")}`;
}
