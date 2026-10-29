import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: { BASIC_AUTH_ENABLED: false } }));

const { liveSlugsMock } = vi.hoisted(() => ({
  liveSlugsMock: vi.fn(async (): Promise<string[]> => ["ECU"]),
}));
vi.mock("@/lib/country-modules/server", () => ({ getActiveModuleSlugs: liveSlugsMock }));

const { startInstance } = await import("./start");

type ProxyArgs = {
  next: (options?: { context?: unknown }) => Promise<{ response: Response }>;
  request: Request;
  pathname: string;
  handlerType: "router" | "serverFn";
};

const { requestMiddleware = [] } = await startInstance.getOptions();
const proxy = (requestMiddleware.at(-1)?.options as { server: (args: ProxyArgs) => unknown })
  .server;

const nextMock = vi.fn(async (_options?: { context?: unknown }) => ({
  response: new Response("ok"),
}));

async function getProxyResponse(url: string, headers?: HeadersInit): Promise<Response> {
  const request = new Request(url, { headers });
  const result = (await proxy({
    next: nextMock,
    request,
    pathname: new URL(url).pathname,
    handlerType: "router",
  })) as Response | { response: Response };

  return result instanceof Response ? result : result.response;
}

beforeEach(() => {
  liveSlugsMock.mockImplementation(async () => ["ECU"]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy middleware", () => {
  it("redirects a country module path to the regional one when the flag is off", async () => {
    vi.stubEnv("VITE_FEATURE_FLAGS", "");

    const res = await getProxyResponse("http://localhost:3000/en/ECU/reports?x=1");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en/reports?x=1");
    expect(nextMock).not.toHaveBeenCalled();
  });

  it("redirects a country module home page to the regional one when the flag is on", async () => {
    vi.stubEnv("VITE_FEATURE_FLAGS", "country-module");

    const res = await getProxyResponse("http://localhost:3000/en/ecu?x=1");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/en?x=1");
    expect(nextMock).not.toHaveBeenCalled();
  });

  it("keeps serving the country module path when the flag is on", async () => {
    vi.stubEnv("VITE_FEATURE_FLAGS", "country-module");

    const res = await getProxyResponse("http://localhost:3000/en/ECU/reports");

    expect(res.headers.get("location")).toBeNull();
    expect(nextMock).toHaveBeenCalledWith({
      context: { currentPath: "/en/ECU/reports", currentUrl: "/en/ECU/reports" },
    });
  });

  it("passes a deactivated module's path through unchanged", async () => {
    vi.stubEnv("VITE_FEATURE_FLAGS", "country-module");
    liveSlugsMock.mockImplementation(async () => []);

    const res = await getProxyResponse("http://localhost:3000/en/ECU/reports");

    expect(res.headers.get("location")).toBeNull();
    expect(nextMock).toHaveBeenCalledWith({
      context: { currentPath: "/en/ECU/reports", currentUrl: "/en/ECU/reports" },
    });
  });

  it("never reads the modules for the admin panel", async () => {
    const res = await getProxyResponse("http://localhost:3000/admin/collections");

    expect(res.status).toBe(200);
    expect(liveSlugsMock).not.toHaveBeenCalled();
  });

  it("prefixes an unprefixed path with the locale from the cookie", async () => {
    const res = await getProxyResponse("http://localhost:3000/reports?x=1", {
      cookie: "NEXT_LOCALE=es",
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/es/reports?x=1");
    expect(nextMock).not.toHaveBeenCalled();
  });

  it("falls back to Accept-Language, then to the default locale", async () => {
    const pt = await getProxyResponse("http://localhost:3000/", { "accept-language": "pt-BR" });
    const fallback = await getProxyResponse("http://localhost:3000/", { "accept-language": "fr" });

    expect(pt.headers.get("location")).toBe("http://localhost:3000/pt");
    expect(fallback.headers.get("location")).toBe("http://localhost:3000/en");
  });
});

describe("trailing slash middleware", () => {
  const trailingSlash = (requestMiddleware[0]?.options as { server: (args: ProxyArgs) => unknown })
    .server;

  async function getTrailingSlashResponse(url: string) {
    return (await trailingSlash({
      next: nextMock,
      request: new Request(url),
      pathname: new URL(url).pathname,
      handlerType: "router",
    })) as Response | { response: Response };
  }

  it.each([
    ["http://localhost:3000/en/partners/?a=1", "http://localhost:3000/en/partners?a=1"],
    ["http://localhost:3000/v1/api/users/me/", "http://localhost:3000/v1/api/users/me"],
    ["http://localhost:3000/en//", "http://localhost:3000/en"],
  ])("permanently redirects %s to %s", async (url, location) => {
    const res = (await getTrailingSlashResponse(url)) as Response;

    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(location);
    expect(nextMock).not.toHaveBeenCalled();
  });

  it.each(["http://localhost:3000/", "http://localhost:3000/en/partners"])(
    "passes %s through",
    async (url) => {
      await getTrailingSlashResponse(url);

      expect(nextMock).toHaveBeenCalledOnce();
    },
  );
});
