import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import createMiddleware from "next-intl/middleware";

import { env } from "@/env.mjs";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");

// Main middleware handler (Next 16: file renamed middleware.ts -> proxy.ts)
export default async function proxy(req: NextRequest) {
  // Step 1: Ignore requests for static files like images, icons, etc.
  const PUBLIC_FILE = /\./;
  if (PUBLIC_FILE.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;

  // Skip basic auth for /admin so the Payload admin panel isn't double-gated.
  // /v1 is excluded from the matcher entirely (see config below) so server-to-
  // self SDK calls bypass the gate without paying middleware overhead.
  if (!isAdminPath(pathname) && !isAuthenticated(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  // Forward the pathname so the authjs strategy can detect admin-context
  // requests and return null, breaking the Payload Unauthorized loop for
  // non-admin Users sessions. This one must stay bare: authjs-strategy
  // compares it with === against "/admin".
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-current-path", pathname);
  // Separate header with the query string, so a gated route can build a
  // return URL that survives the round-trip through sign-in.
  requestHeaders.set("x-current-url", `${pathname}${req.nextUrl.search}`);

  if (isAdminPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const response = intlMiddleware(req);
  response.headers.set("x-current-path", pathname);
  response.headers.set("x-current-url", `${pathname}${req.nextUrl.search}`);
  return response;
}

function isAuthenticated(req: NextRequest) {
  if (!env.BASIC_AUTH_ENABLED) return true;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const [user, pass] = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");

  return user === env.BASIC_AUTH_USER && pass === env.BASIC_AUTH_PASSWORD;
}

export const config = {
  matcher: ["/((?!local-api|api|v1|_next|.*\\..*).*)"],
};
