import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import createMiddleware from "next-intl/middleware";

import { env } from "@/env.mjs";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PAYLOAD_PATH_PREFIXES = ["/admin", "/v1"];

const isPayloadPath = (pathname: string) =>
  PAYLOAD_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export default async function middleware(req: NextRequest) {
  const PUBLIC_FILE = /\.(.*)$/;
  if (PUBLIC_FILE.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;

  // Skip basic auth for Payload paths (/admin, /v1) so server-to-self REST
  // calls from NextAuth / server actions aren't blocked by the gate. The
  // matcher still includes these paths so x-current-path is forwarded
  // downstream, which the authjs strategy needs for the /admin loop fix.
  if (!isPayloadPath(pathname) && !isAuthenticated(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  // Forward the pathname so downstream auth strategies can detect admin-context
  // requests (Payload admin + REST). Without this, the Users authjs strategy would
  // authenticate non-admin users on /admin and trigger Payload's Unauthorized loop.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-current-path", pathname);

  if (isPayloadPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const response = intlMiddleware(req);
  response.headers.set("x-current-path", pathname);
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
  matcher: ["/((?!local-api|api|_next|.*\\..*).*)"],
};
