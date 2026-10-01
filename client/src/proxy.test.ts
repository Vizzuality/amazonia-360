// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env.mjs", () => ({ env: { BASIC_AUTH_ENABLED: false } }));

const { intlMock } = vi.hoisted(() => ({ intlMock: vi.fn() }));
vi.mock("next-intl/middleware", () => ({ default: () => intlMock }));

const proxy = (await import("./proxy")).default;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy", () => {
  it("redirects a country module path to the regional one when the flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    const res = await proxy(new NextRequest("http://localhost:3000/en/ECU/reports?x=1"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en/reports?x=1");
    expect(intlMock).not.toHaveBeenCalled();
  });

  it.each([
    ["/en/ECU", "http://localhost:3000/en"],
    ["/en/ecu?x=1", "http://localhost:3000/en?x=1"],
  ])(
    "redirects the module home page %s to the regional one when the flag is on",
    async (path, location) => {
      vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");

      const res = await proxy(new NextRequest(`http://localhost:3000${path}`));

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(location);
      expect(intlMock).not.toHaveBeenCalled();
    },
  );

  it("keeps serving the country module path when the flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
    intlMock.mockImplementationOnce(() => {
      const res = NextResponse.next();
      res.headers.set("x-middleware-rewrite", "http://localhost:3000/en/ECU/reports");
      return res;
    });

    const res = await proxy(new NextRequest("http://localhost:3000/en/ECU/reports"));

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toMatch(/\/en\/reports$/);
    expect(res.headers.get("x-current-path")).toBe("/en/ECU/reports");
  });
});
