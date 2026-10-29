const UNSCOPED_ROOTS: ReadonlySet<string> = new Set(["auth", "partners", "private", "webshot"]);

// No live slug may ever become the name of a first-level route: with the module absent from
// the route tree, a first segment matching one is the only thing that tells `proxy.ts` a
// module was named. The CMS slug validation reserves those names.
function isModuleSlug(value: string | undefined, liveSlugs: readonly string[]): boolean {
  return !!value && liveSlugs.includes(value);
}

// Deduped and sorted so the same set of modules always produces the same query key,
// whatever order the caller holds them in.
export function getModuleSlugs(
  value: string | readonly (string | null)[] | null | undefined,
  liveSlugs: readonly string[],
): string[] {
  const values = typeof value === "string" ? [value] : (value ?? []);
  return [
    ...new Set(
      values.filter((entry): entry is string => isModuleSlug(entry ?? undefined, liveSlugs)),
    ),
  ].sort((a, b) => a.localeCompare(b));
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

// A saved report carries its own `country`, so on its page the URL's module says nothing:
// the report tool's routes are the ones still steered by it.
const REPORT_TOOL_SEGMENTS: ReadonlySet<string> = new Set(["grid", "indicators"]);

export function isSavedReportPathname(pathname: string): boolean {
  const [first, second, ...rest] = segmentsOf(pathname);
  return first === "reports" && !!second && rest.length === 0 && !REPORT_TOOL_SEGMENTS.has(second);
}

// Idempotent on purpose: `Link` applies this to every href it is given, including hrefs
// the picker has already resolved to another module.
export function withCountry(
  pathname: string,
  slug: string | null,
  liveSlugs: readonly string[],
): string {
  if (!pathname.startsWith("/")) return pathname;
  if (slug === null) return pathname;
  if (pathname === "/") return pathname;
  if (isUnscopedPathname(pathname)) return pathname;
  if (isModuleSlug(segmentsOf(pathname)[0], liveSlugs)) return pathname;
  return `/${slug}${pathname}`;
}

export function resolveCountryHref<Href>(
  href: Href,
  slug: string | null,
  liveSlugs: readonly string[],
): Href {
  if (typeof href === "string") {
    return withCountry(href, slug, liveSlugs) as Href;
  }

  if (href && typeof href === "object" && "pathname" in href) {
    const { pathname } = href as { pathname?: unknown };
    if (typeof pathname !== "string") return href;
    return { ...href, pathname: withCountry(pathname, slug, liveSlugs) };
  }

  return href;
}

export function stripCountry(pathname: string, liveSlugs: readonly string[]): string {
  const segments = segmentsOf(pathname);
  if (!isModuleSlug(segments[0], liveSlugs)) return pathname;
  return `/${segments.slice(1).join("/")}`;
}

// Reads the URL, not the route param: the param does not exist, because `proxy.ts`
// rewrites the slug away before Next routes the request.
export function countryFromPathname(
  pathname: string,
  locales: readonly string[],
  liveSlugs: readonly string[],
): string | null {
  const segments = segmentsOf(pathname);
  const first = locales.includes(segments[0]) ? segments[1] : segments[0];
  return isModuleSlug(first, liveSlugs) ? first : null;
}

function getStoredSlug(segment: string, liveSlugs: readonly string[]): string | undefined {
  const lower = segment.toLowerCase();
  return liveSlugs.find((slug) => slug.toLowerCase() === lower);
}

export function canonicalCountryPathname(
  pathname: string,
  locales: readonly string[],
  liveSlugs: readonly string[],
): string | null {
  const segments = segmentsOf(pathname);
  const [locale, first, ...tail] = segments;

  if (!locales.includes(locale)) return null;
  if (first === undefined || isModuleSlug(first, liveSlugs)) return null;

  const stored = getStoredSlug(first, liveSlugs);
  if (stored === undefined) return null;

  return `/${[locale, stored, ...tail].join("/")}`;
}

// A segment that is not a live slug is left in place on purpose: it matches no route and
// falls into the catch-all that 404s, with the typed slug still in the bar.
export function routedPathname(
  pathname: string,
  locales: readonly string[],
  liveSlugs: readonly string[],
): string | null {
  const segments = segmentsOf(pathname);
  const [locale, first, ...tail] = segments;

  if (!locales.includes(locale)) return null;
  if (!isModuleSlug(first, liveSlugs)) return null;

  return `/${[locale, ...tail].join("/")}`;
}

export function getRegionalPathname(
  pathname: string,
  locales: readonly string[],
  liveSlugs: readonly string[],
): string | null {
  return routedPathname(
    canonicalCountryPathname(pathname, locales, liveSlugs) ?? pathname,
    locales,
    liveSlugs,
  );
}

export function getRegionalHomePathname(
  pathname: string,
  locales: readonly string[],
  liveSlugs: readonly string[],
): string | null {
  const regional = getRegionalPathname(pathname, locales, liveSlugs);
  return regional !== null && segmentsOf(regional).length === 1 ? regional : null;
}
