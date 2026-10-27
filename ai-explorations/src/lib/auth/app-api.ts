import type { SanitizedConfig } from "payload";

import { getPayloadTokenCookieName, getUserPayloadHeaders } from "@/lib/auth/user-token";

export const APP_API_PATH = "/v1/app-api";

const METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"] as const;

type Method = (typeof METHODS)[number];

type ApiHandler = (ctx: { request: Request }) => Promise<Response>;

type GetConfig = () => Promise<SanitizedConfig>;

type PayloadApiHandlers = (options: { getConfig: GetConfig }) => Record<Method, ApiHandler>;

function getRequestBody(request: Request): ReadableStream<Uint8Array> | null {
  return ["GET", "HEAD"].includes(request.method) ? null : request.body;
}

function getPayloadRequest(request: Request, config: SanitizedConfig): Request {
  const url = new URL(request.url);
  url.pathname = `${config.routes.api}${url.pathname.slice(APP_API_PATH.length)}`;

  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers: getUserPayloadHeaders(request.headers, config.cookiePrefix),
    body: getRequestBody(request),
    duplex: "half",
    signal: request.signal,
  };

  return new Request(url, init);
}

function getSetCookieName(cookie: string): string {
  return cookie.slice(0, cookie.indexOf("=")).trim();
}

export function getAppApiResponse(response: Response, cookiePrefix: string): Response {
  const payloadCookie = getPayloadTokenCookieName(cookiePrefix);
  const headers = new Headers(response.headers);

  headers.delete("set-cookie");
  for (const cookie of response.headers.getSetCookie()) {
    if (getSetCookieName(cookie) !== payloadCookie) headers.append("set-cookie", cookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Payload's REST API for the app's browser calls, authenticated by the user token cookie
 * instead of the shared Payload cookie that `/v1/api` and /admin use.
 */
export function getAppApiHandlers(
  getConfig: GetConfig,
  payloadApiHandlers: PayloadApiHandlers,
): Record<Method, ApiHandler> {
  const api = payloadApiHandlers({ getConfig });

  const handler: ApiHandler = async ({ request }) => {
    const config = await getConfig();
    const forward = api[request.method as Method] ?? api.GET;
    const response = await forward({ request: getPayloadRequest(request, config) });
    return getAppApiResponse(response, config.cookiePrefix);
  };

  return Object.fromEntries(METHODS.map((method) => [method, handler])) as Record<
    Method,
    ApiHandler
  >;
}
