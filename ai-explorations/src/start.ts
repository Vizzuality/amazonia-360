import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import {
  canonicalCountryPathname,
  getRegionalHomePathname,
  getRegionalPathname,
} from "@/lib/country";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getUnauthorizedResponse, isAuthenticated } from "@/lib/server/basic-auth";

import { getAlternateLinksHeader, getIntlMiddlewareResult } from "@/i18n/middleware";
import { routing } from "@/i18n/routing";

export type RequestContext = {
  currentPath?: string;
  currentUrl?: string;
};

const MATCHER = /^\/(?!local-api|api|v1|_next|.*\..*).*$/;
const PUBLIC_FILE = /\./;

const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");

function getRedirectResponse(url: URL, setCookie?: string | null) {
  const headers = new Headers({ location: url.toString() });
  if (setCookie) headers.append("set-cookie", setCookie);
  return new Response(null, { status: 307, headers });
}

// Next answers every trailing-slash URL, API routes included, with a 308 before any middleware.
const trailingSlashMiddleware = createMiddleware().server(({ next, request, pathname }) => {
  if (pathname === "/" || !pathname.endsWith("/")) return next();

  const url = new URL(request.url);
  url.pathname = pathname.replace(/\/+$/, "") || "/";
  return new Response(null, { status: 308, headers: { location: url.toString() } });
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const proxyMiddleware = createMiddleware().server(
  async ({ next, request, pathname, handlerType }) => {
    if (handlerType === "serverFn" || !MATCHER.test(pathname) || PUBLIC_FILE.test(pathname)) {
      return next();
    }

    if (!isAdminPath(pathname) && !isAuthenticated(request)) {
      return getUnauthorizedResponse();
    }

    const { search } = new URL(request.url);
    const context: RequestContext = { currentPath: pathname, currentUrl: `${pathname}${search}` };

    if (isAdminPath(pathname)) return next({ context });

    const { getActiveModuleSlugs } = await import("@/lib/country-modules/server");
    const liveSlugs = await getActiveModuleSlugs();

    const regional = isFeatureEnabled("country-module")
      ? getRegionalHomePathname(pathname, routing.locales, liveSlugs)
      : getRegionalPathname(pathname, routing.locales, liveSlugs);
    if (regional) {
      const url = new URL(request.url);
      url.pathname = regional;
      return getRedirectResponse(url);
    }

    // 307 and not 308: report URL semantics may change once reports gain a country of
    // their own, and a permanently-cached redirect cannot be withdrawn from browsers.
    const canonical = canonicalCountryPathname(pathname, routing.locales, liveSlugs);
    if (canonical && canonical !== pathname) {
      const url = new URL(request.url);
      url.pathname = canonical;
      return getRedirectResponse(url);
    }

    const intl = getIntlMiddlewareResult(request);
    if (!intl) return next({ context });
    if (intl.redirect) return getRedirectResponse(intl.redirect, intl.setCookie);

    const result = await next({ context });
    const headers = result.response.headers;
    if (intl.setCookie) headers.append("set-cookie", intl.setCookie);
    headers.set("link", getAlternateLinksHeader(request));
    return result;
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [trailingSlashMiddleware, csrfMiddleware, proxyMiddleware],
}));

declare module "@tanstack/react-start" {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>;
  }
}
