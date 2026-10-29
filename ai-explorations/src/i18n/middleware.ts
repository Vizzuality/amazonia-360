import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { hasLocale } from "use-intl";

import { routing } from "./routing";

// Port of next-intl 4.9.2 middleware for this app's routing (prefix "always", no domains, no
// localized pathnames): https://github.com/amannn/next-intl/blob/v4.9.2/packages/next-intl/src/middleware/middleware.tsx
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

type Locale = (typeof routing.locales)[number];

type PathnameMatch = {
  locale: Locale;
  prefix: string;
  exact: boolean;
};

export type IntlMiddlewareResult = {
  locale: Locale;
  redirect: URL | null;
  setCookie: string | null;
};

function getLocalePrefixes(): [Locale, string][] {
  return routing.locales
    .map((locale): [Locale, string] => [locale, `/${locale}`])
    .sort((a, b) => b[1].length - a[1].length);
}

function getNormalizedTrailingSlash(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function getSanitizedPathname(pathname: string): string {
  return pathname
    .replace(/\\/g, "%5C")
    .replace(/[\t\n\r]/g, "")
    .replace(/\/+/g, "/");
}

export function getPathnameMatch(pathname: string): PathnameMatch | undefined {
  for (const [locale, prefix] of getLocalePrefixes()) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { locale, prefix, exact: true };
    }

    const normalizedPathname = pathname.toLowerCase();
    if (normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`)) {
      return { locale, prefix, exact: false };
    }
  }
  return undefined;
}

export function getNormalizedPathname(pathname: string): string {
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const prefixes = getLocalePrefixes()
    .map(([, prefix]) => prefix.replaceAll("/", "\\/"))
    .join("|");
  const found = withSlash.match(new RegExp(`^(${prefixes})/(.*)`, "i"));
  const result = found ? `/${found[2]}` : withSlash;
  return result === "/" ? result : getNormalizedTrailingSlash(result);
}

function getPrefixedPathname(prefix: string, pathname: string): string {
  return /^\/(\?.*)?$/.test(pathname) ? `${prefix}${pathname.slice(1)}` : `${prefix}${pathname}`;
}

export function getAcceptLanguageLocale(headers: Headers): Locale | undefined {
  const languages = new Negotiator({
    headers: { "accept-language": headers.get("accept-language") || undefined },
  }).languages();

  try {
    const ordered = [...routing.locales].sort((a, b) => b.length - a.length);
    const matched = match(languages, ordered, routing.defaultLocale);
    return routing.locales.find((locale) => locale.toLowerCase() === matched.toLowerCase());
  } catch {
    return undefined;
  }
}

function getCookieValue(headers: Headers, name: string): string | undefined {
  const cookies = headers.get("cookie") ?? "";
  for (const pair of cookies.split(/; */)) {
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    if (pair.slice(0, separator) !== name) continue;
    try {
      return decodeURIComponent(pair.slice(separator + 1));
    } catch {
      return pair.slice(separator + 1);
    }
  }
  return undefined;
}

function hasCookie(headers: Headers, name: string): boolean {
  return getCookieValue(headers, name) !== undefined;
}

function getCookieLocale(headers: Headers): Locale | undefined {
  const value = getCookieValue(headers, LOCALE_COOKIE_NAME);
  return hasLocale(routing.locales, value) ? value : undefined;
}

function getResolvedLocale(headers: Headers, pathname: string): Locale {
  return (
    getPathnameMatch(pathname)?.locale ??
    getCookieLocale(headers) ??
    getAcceptLanguageLocale(headers) ??
    routing.defaultLocale
  );
}

function getLocaleCookieHeader(locale: Locale): string {
  return `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; SameSite=lax`;
}

export function getSyncedLocaleCookie(headers: Headers, locale: Locale): string | null {
  if (hasCookie(headers, LOCALE_COOKIE_NAME)) {
    return getCookieValue(headers, LOCALE_COOKIE_NAME) === locale
      ? null
      : getLocaleCookieHeader(locale);
  }
  return getAcceptLanguageLocale(headers) === locale ? null : getLocaleCookieHeader(locale);
}

function getRedirectUrl(pathname: string, search: string, requestUrl: string): URL {
  const url = new URL(`${pathname}${search}`, requestUrl);
  url.pathname = getNormalizedTrailingSlash(url.pathname);
  return url;
}

export function getIntlMiddlewareResult(request: Request): IntlMiddlewareResult | null {
  const requestUrl = new URL(request.url);

  let decodedPathname: string;
  try {
    decodedPathname = decodeURI(requestUrl.pathname);
  } catch {
    return null;
  }

  const externalPathname = getSanitizedPathname(decodedPathname);
  const locale = getResolvedLocale(request.headers, externalPathname);
  const unprefixedPathname = getNormalizedPathname(externalPathname);
  const pathnameMatch = getPathnameMatch(externalPathname);
  const setCookie = getSyncedLocaleCookie(request.headers, locale);

  if (pathnameMatch?.exact) {
    return { locale, redirect: null, setCookie };
  }

  const prefix = pathnameMatch?.prefix ?? `/${locale}`;
  const redirect = getRedirectUrl(
    getPrefixedPathname(prefix, unprefixedPathname),
    requestUrl.search,
    request.url,
  );

  return { locale, redirect, setCookie };
}

export function getAlternateLinksHeader(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    url.port = "";
    url.host = host;
  }
  url.protocol = request.headers.get("x-forwarded-proto") ?? url.protocol;
  url.pathname = getNormalizedPathname(url.pathname);

  const getEntry = (target: URL, hreflang: string) => {
    target.pathname = getNormalizedTrailingSlash(target.pathname);
    return `<${target.toString()}>; rel="alternate"; hreflang="${hreflang}"`;
  };

  const links = routing.locales.map((locale) => {
    const pathname = url.pathname === "/" ? `/${locale}` : `/${locale}${url.pathname}`;
    return getEntry(new URL(pathname, url), locale);
  });
  links.push(getEntry(new URL(url.pathname, url), "x-default"));

  return links.join(", ");
}
