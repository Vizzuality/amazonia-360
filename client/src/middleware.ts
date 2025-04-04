import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import createMiddleware from "next-intl/middleware";

import { env } from "@/env.mjs";

import { routing } from "@/i18n/routing";

// Initialize the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Main middleware handler
export default async function middleware(req: NextRequest) {
  // Define the API URL for rewrite or proxy
  const API_URL = /\/custom-api/;
  if (API_URL.test(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = req.nextUrl.pathname.replace(API_URL, "");
    console.log(`Rewriting request to ${env.NEXT_PUBLIC_API_URL}${url.pathname}`);
    console.log(`API key ${env.NEXT_PUBLIC_API_KEY}`);

    return NextResponse.rewrite(
      new URL(env.NEXT_PUBLIC_API_URL + url.pathname, req.nextUrl.origin),
      {
        headers: {
          Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
        },
      },
    );
  }

  // Step 1: Ignore requests for static files like images, icons, etc.
  const PUBLIC_FILE = /\.(.*)$/;
  if (PUBLIC_FILE.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Step 2: Apply HTTP Basic Auth if enabled in the environment
  if (!isAuthenticated(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  // Step 3: Apply locale-based routing using next-intl
  return intlMiddleware(req);
}

// HTTP Basic Auth logic
function isAuthenticated(req: NextRequest) {
  // Skip auth if disabled via environment config
  if (!env.BASIC_AUTH_ENABLED) return true;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const [user, pass] = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");

  return user === env.BASIC_AUTH_USER && pass === env.BASIC_AUTH_PASSWORD;
}

// Middleware matcher: apply to all routes except static assets and Next.js internals
export const config = {
  matcher: [
    // This pattern skips:
    // - /api
    // - /_next
    // - all static files like .png, .ico, etc.
    "/((?!local-api|_next|.*\\..*).*)",
  ],
};
