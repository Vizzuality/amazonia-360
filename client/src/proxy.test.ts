// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env.mjs", () => ({ env: { BASIC_AUTH_ENABLED: false } }));

const { intlMock, liveSlugsMock } = vi.hoisted(() => ({
  intlMock: vi.fn(),
  liveSlugsMock: vi.fn(async (): Promise<string[]> => ["ECU"]),
}));
vi.mock("next-intl/middleware", () => ({ default: () => intlMock }));
vi.mock("@/lib/country-modules/server", () => ({ getActiveModuleSlugs: liveSlugsMock }));

const proxy = (await import("./proxy")).default;

afterEach(() => {
  vi.unstubAllEnvs();
  liveSlugsMock.mockImplementation(async () => ["ECU"]);
});

function getIntlPassThrough(pathname: string) {
  return () => {
    const res = NextResponse.next();
    res.headers.set("x-middleware-rewrite", `http://localhost:3000${pathname}`);
    return res;
  };
}

describe("proxy", () => {
  it("redirects a country module path to the regional one when the flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");

    const res = await proxy(new NextRequest("http://localhost:3000/en/ECU/reports?x=1"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en/reports?x=1");
    expect(intlMock).not.toHaveBeenCalled();
  });

  it("redirects a country module home page to the regional one when the flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");

    const res = await proxy(new NextRequest("http://localhost:3000/en/ecu?x=1"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en?x=1");
    expect(intlMock).not.toHaveBeenCalled();
  });

  it("keeps serving the country module path when the flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
    intlMock.mockImplementationOnce(getIntlPassThrough("/en/ECU/reports"));

    const res = await proxy(new NextRequest("http://localhost:3000/en/ECU/reports"));

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toMatch(/\/en\/reports$/);
    expect(res.headers.get("x-current-path")).toBe("/en/ECU/reports");
  });

  it("leaves a deactivated module's path in place, so it falls through to the 404", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
    liveSlugsMock.mockImplementation(async () => []);
    intlMock.mockImplementationOnce(getIntlPassThrough("/en/ECU/reports"));

    const res = await proxy(new NextRequest("http://localhost:3000/en/ECU/reports"));

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en/ECU/reports");
  });

  it("never reads the modules for the admin panel", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/admin/collections"));

    expect(res.status).toBe(200);
    expect(liveSlugsMock).not.toHaveBeenCalled();
  });
});
