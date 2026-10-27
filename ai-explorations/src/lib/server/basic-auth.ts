import { createMiddleware } from "@tanstack/react-start";

import { getRequest } from "@tanstack/react-start/server";

import { env } from "@/env";

export function isAuthenticated(request: Request) {
  if (!env.BASIC_AUTH_ENABLED) return true;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const [user, pass] = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");

  return user === env.BASIC_AUTH_USER && pass === env.BASIC_AUTH_PASSWORD;
}

export function getUnauthorizedResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic" },
  });
}

export const basicAuthFnMiddleware = createMiddleware({ type: "function" }).server(({ next }) => {
  if (!isAuthenticated(getRequest())) throw getUnauthorizedResponse();
  return next();
});
