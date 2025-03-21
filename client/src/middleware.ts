import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { env } from "@/env.mjs";

// Step 1. HTTP Basic Auth Middleware for Challenge
export default async function middleware(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" },
    });
  }

  const response = NextResponse.next();

  return response;
}

// Step 2. Check HTTP Basic Auth header if present
function isAuthenticated(req: NextRequest) {
  if (!env.BASIC_AUTH_ENABLED) {
    return true;
  }

  const authheader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authheader) {
    return false;
  }

  const auth = Buffer.from(authheader.split(" ")[1], "base64").toString().split(":");
  const user = auth[0];
  const pass = auth[1];

  if (user == env.BASIC_AUTH_USER && pass == env.BASIC_AUTH_PASSWORD) {
    return true;
  } else {
    return false;
  }
}

// Step 3. Configure "Matching Paths" below to protect routes with HTTP Basic Auth
export const config = {
  matcher: "/((?!local-api|_next/static|_next/image|favicon.ico|manifest.json).*)",
};
