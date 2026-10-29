import type { SanitizedConfig } from "payload";

import { describe, expect, test, vi } from "vitest";

import { getAppApiHandlers } from "./app-api";

const CONFIG = {
  cookiePrefix: "ai-explorations",
  routes: { api: "/v1/api" },
} as unknown as SanitizedConfig;

function getProxy(response: Response) {
  const forward = vi.fn(async (_ctx: { request: Request }) => response);
  const payloadApiHandlers = vi.fn(() => ({
    DELETE: forward,
    GET: forward,
    OPTIONS: forward,
    PATCH: forward,
    POST: forward,
    PUT: forward,
  }));
  const handlers = getAppApiHandlers(async () => CONFIG, payloadApiHandlers);
  return { handlers, forward };
}

describe("getAppApiHandlers", () => {
  test("forwards to Payload's API path with the query, method, body and user headers", async () => {
    const { handlers, forward } = getProxy(Response.json({ ok: true }));

    const response = await handlers.PATCH({
      request: new Request("http://localhost:3100/v1/app-api/reports/r1?depth=0&locale=en", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: "ai-explorations-token=admin; ai-explorations-user-token=u.s.er",
        },
        body: JSON.stringify({ title: "New" }),
      }),
    });

    const forwarded = forward.mock.calls[0][0].request;
    expect(forwarded.url).toBe("http://localhost:3100/v1/api/reports/r1?depth=0&locale=en");
    expect(forwarded.method).toBe("PATCH");
    expect(await forwarded.json()).toEqual({ title: "New" });
    expect(forwarded.headers.get("content-type")).toBe("application/json");
    expect(forwarded.headers.get("authorization")).toBe("JWT u.s.er");
    expect(forwarded.headers.get("cookie")).toBe("ai-explorations-user-token=u.s.er");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("forwards a request without the user cookie anonymously", async () => {
    const { handlers, forward } = getProxy(Response.json({ docs: [] }));

    await handlers.GET({
      request: new Request("http://localhost:3100/v1/app-api/topics?limit=1", {
        headers: { cookie: "ai-explorations-token=admin" },
      }),
    });

    const forwarded = forward.mock.calls[0][0].request;
    expect(forwarded.headers.get("authorization")).toBeNull();
    expect(forwarded.headers.get("cookie")).toBeNull();
  });

  test("drops Payload's token cookie from the response and keeps the others", async () => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", "ai-explorations-token=new; Path=/; HttpOnly=true");
    headers.append("set-cookie", "NEXT_LOCALE=es; Path=/");
    const { handlers } = getProxy(new Response("{}", { status: 201, headers }));

    const response = await handlers.POST({
      request: new Request("http://localhost:3100/v1/app-api/users/login", {
        method: "POST",
        body: "{}",
      }),
    });

    expect(response.status).toBe(201);
    expect(response.headers.getSetCookie()).toEqual(["NEXT_LOCALE=es; Path=/"]);
    expect(response.headers.get("content-type")).toBe("application/json");
  });

  test("answers HEAD through Payload's GET handler without a body", async () => {
    const { handlers, forward } = getProxy(new Response(null, { status: 200 }));

    const response = await handlers.GET({
      request: new Request("http://localhost:3100/v1/app-api/topics", { method: "HEAD" }),
    });

    const forwarded = forward.mock.calls[0][0].request;
    expect(forwarded.method).toBe("HEAD");
    expect(forwarded.body).toBeNull();
    expect(response.status).toBe(200);
  });
});
