import { ParsedLocation } from "@tanstack/react-router";

import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  requireGuestBeforeLoad,
  requireUserBeforeLoad,
  requireUserBelowIndexBeforeLoad,
} from "./gates";
import { DEFAULT_SIGNED_IN_REDIRECT, resolveRedirect } from "./redirect-url";

const startContext = vi.hoisted(() => ({ currentUrl: undefined as string | undefined }));

vi.mock("@tanstack/react-start", () => ({
  getGlobalStartContext: () => ({ currentUrl: startContext.currentUrl }),
}));

vi.mock("@/lib/auth/react", () => ({
  getSessionQueryOptions: () => ({ queryKey: ["auth", "session"] }),
}));

type GateOptions = Parameters<typeof requireUserBeforeLoad>[0] & {
  matches: readonly { routeId: string }[];
};

const USER_SESSION = { user: { id: "user-1", collection: "users" } };
const ADMIN_SESSION = { user: { id: "admin-1", collection: "admins" } };
const ANONYMOUS_SESSION = { user: { id: "anon-1", collection: "anonymous-users" } };

function getGateOptions({
  url,
  session = null,
  routeId = "/$locale/{-$country}/reports",
  leafRouteId = routeId,
  country,
  locale = "en",
}: {
  url: string;
  session?: unknown;
  routeId?: string;
  leafRouteId?: string;
  country?: string;
  locale?: "en" | "es" | "pt";
}): GateOptions {
  startContext.currentUrl = url;
  const { pathname, search } = new URL(url, "http://localhost");
  const queryClient = { fetchQuery: vi.fn().mockResolvedValue(session) };

  return {
    context: { queryClient: queryClient as unknown as QueryClient, locale },
    location: { pathname, searchStr: search } as ParsedLocation,
    matches: [{ routeId: "__root__" }, { routeId }, { routeId: leafRouteId }],
    params: { country },
    routeId,
  };
}

async function getRedirectHref(run: Promise<void>): Promise<string | null> {
  try {
    await run;
    return null;
  } catch (error) {
    const href = (error as { options?: { href?: string } }).options?.href;
    if (href === undefined) throw error;
    return href;
  }
}

beforeEach(() => {
  startContext.currentUrl = undefined;
});

describe("requireUserBeforeLoad", () => {
  test("lets a users session through", async () => {
    const options = getGateOptions({ url: "/en/reports/abc", session: USER_SESSION });

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBeNull();
  });

  test("sends a signed-out visitor to sign-in with the locale-free path and query", async () => {
    const options = getGateOptions({ url: "/en/reports/abc?tab=map" });

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBe(
      "/en/auth/sign-in?redirectUrl=%2Freports%2Fabc%3Ftab%3Dmap",
    );
  });

  test("treats an admin token as signed out", async () => {
    const options = getGateOptions({ url: "/en/reports/abc", session: ADMIN_SESSION });

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBe(
      "/en/auth/sign-in?redirectUrl=%2Freports%2Fabc",
    );
  });

  test("treats a stale anonymous session as signed out", async () => {
    const options = getGateOptions({ url: "/en/reports/abc", session: ANONYMOUS_SESSION });

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBe(
      "/en/auth/sign-in?redirectUrl=%2Freports%2Fabc",
    );
  });

  test("keeps the query string and the requested locale in the return URL", async () => {
    const options = getGateOptions({ url: "/pt/reports/grid?location=xyz", locale: "pt" });

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBe(
      "/pt/auth/sign-in?redirectUrl=%2Freports%2Fgrid%3Flocation%3Dxyz",
    );
  });

  test("drops the query on a country path", async () => {
    const options = getGateOptions({ url: "/en/ECU/reports/abc?tab=map", country: "ECU" });

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBe(
      "/en/auth/sign-in?redirectUrl=%2FECU%2Freports%2Fabc",
    );
  });

  test("falls back to the router location when there is no start context URL", async () => {
    const options = getGateOptions({ url: "/en/reports/abc?tab=map" });
    startContext.currentUrl = undefined;

    await expect(getRedirectHref(requireUserBeforeLoad(options))).resolves.toBe(
      "/en/auth/sign-in?redirectUrl=%2Freports%2Fabc%3Ftab%3Dmap",
    );
  });
});

describe("requireUserBelowIndexBeforeLoad", () => {
  const WEBSHOT = "/$locale/{-$country}/webshot";
  const PRIVATE = "/$locale/{-$country}/private";

  test.each([
    ["/en/webshot", WEBSHOT],
    ["/en/private/", PRIVATE],
    ["/en/ECU/private", PRIVATE],
  ])("skips the gate on the layout's own index %s", async (url, routeId) => {
    const options = getGateOptions({ url, routeId, leafRouteId: `${routeId}/` });

    await expect(getRedirectHref(requireUserBelowIndexBeforeLoad(options))).resolves.toBeNull();
  });

  test.each([
    [
      "/en/webshot/reports/webshot",
      WEBSHOT,
      `${WEBSHOT}/reports/$id`,
      "%2Fwebshot%2Freports%2Fwebshot",
    ],
    ["/en/webshot/reports/abc", WEBSHOT, `${WEBSHOT}/reports/$id`, "%2Fwebshot%2Freports%2Fabc"],
    ["/en/private/my-reports", PRIVATE, `${PRIVATE}/my-reports`, "%2Fprivate%2Fmy-reports"],
    [
      "/en/private/profile/private",
      PRIVATE,
      `${PRIVATE}/profile`,
      "%2Fprivate%2Fprofile%2Fprivate",
    ],
  ])("gates the child path %s", async (url, routeId, leafRouteId, redirectUrl) => {
    const options = getGateOptions({ url, routeId, leafRouteId });

    await expect(getRedirectHref(requireUserBelowIndexBeforeLoad(options))).resolves.toBe(
      `/en/auth/sign-in?redirectUrl=${redirectUrl}`,
    );
  });

  test("gates a country child path whose last segment is the layout name", async () => {
    const options = getGateOptions({
      url: "/en/ECU/webshot/reports/webshot",
      routeId: WEBSHOT,
      leafRouteId: `${WEBSHOT}/reports/$id`,
      country: "ECU",
    });

    await expect(getRedirectHref(requireUserBelowIndexBeforeLoad(options))).resolves.toBe(
      "/en/auth/sign-in?redirectUrl=%2FECU%2Fwebshot%2Freports%2Fwebshot",
    );
  });

  test("lets a users session through to a child path", async () => {
    const options = getGateOptions({
      url: "/en/webshot/reports/webshot",
      routeId: WEBSHOT,
      leafRouteId: `${WEBSHOT}/reports/$id`,
      session: USER_SESSION,
    });

    await expect(getRedirectHref(requireUserBelowIndexBeforeLoad(options))).resolves.toBeNull();
  });
});

describe("requireGuestBeforeLoad", () => {
  const SIGN_IN = "/$locale/{-$country}/_app/auth/sign-in";

  function getSignInOptions(search: string, session: unknown = USER_SESSION) {
    return getGateOptions({ url: `/en/auth/sign-in${search}`, routeId: SIGN_IN, session });
  }

  test("lets a signed-out visitor stay", async () => {
    const options = getSignInOptions("?redirectUrl=%2Freports", null);

    await expect(getRedirectHref(requireGuestBeforeLoad(options))).resolves.toBeNull();
  });

  test("lets a stale anonymous session stay", async () => {
    const options = getSignInOptions("?redirectUrl=%2Freports", ANONYMOUS_SESSION);

    await expect(getRedirectHref(requireGuestBeforeLoad(options))).resolves.toBeNull();
  });

  test("sends a signed-in user to a safe redirectUrl", async () => {
    const options = getSignInOptions("?redirectUrl=%2Fen%2Freports%2Fabc%3Ftab%3Dmap");

    await expect(getRedirectHref(requireGuestBeforeLoad(options))).resolves.toBe(
      "/en/reports/abc?tab=map",
    );
  });

  test("sends a signed-in user without a redirectUrl to the default target", async () => {
    await expect(getRedirectHref(requireGuestBeforeLoad(getSignInOptions("")))).resolves.toBe(
      `/en${DEFAULT_SIGNED_IN_REDIRECT}`,
    );
  });

  test.each([
    ["protocol-relative", "%2F%2Fevil.com"],
    ["absolute", "https%3A%2F%2Fevil.com"],
    ["backslash", "%2F%5Cevil.com"],
    ["CRLF", "%2Fpath%0D%0ASet-Cookie%3Ax%3D1"],
    ["auth page", "%2Fen%2Fauth%2Fsign-in"],
    ["repeated", "%2Freports&redirectUrl=%2Fprivate%2Fprofile"],
  ])("sends a %s redirectUrl to the default target", async (_, redirectUrl) => {
    const options = getSignInOptions(`?redirectUrl=${redirectUrl}`);

    await expect(getRedirectHref(requireGuestBeforeLoad(options))).resolves.toBe(
      `/en${DEFAULT_SIGNED_IN_REDIRECT}`,
    );
  });
});

describe("resolveRedirect", () => {
  test.each([
    ["/reports/abc", "/reports/abc"],
    ["/es/reports/abc?tab=map", "/reports/abc?tab=map"],
    [["/private/profile"], "/private/profile"],
  ])("keeps the safe target %j as %s", (url, expected) => {
    expect(resolveRedirect(url)).toBe(expected);
  });

  test.each([
    [undefined],
    [null],
    [""],
    [[]],
    [["/reports", "/private/profile"]],
    ["reports"],
    ["//evil.com"],
    ["/en//evil.com"],
    ["/es//evil.com/path?x=1"],
    ["https://evil.com"],
    ["/\\evil.com"],
    ["/auth"],
    ["/en/auth/sign-up"],
    ["/path\r\nSet-Cookie: x=1"],
    ["/path\nnext"],
    ["/path\tnext"],
    ["/path\u0000next"],
    ["/path\u007fnext"],
    ["/en/..//evil.com"],
    ["/../evil.com"],
    ["/en/%2e%2e//evil.com"],
    ["/reports/./x"],
  ])("falls back to the default target for %j", (url) => {
    expect(resolveRedirect(url)).toBe(DEFAULT_SIGNED_IN_REDIRECT);
  });
});
