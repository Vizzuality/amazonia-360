import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  login: vi.fn(),
  logoutOperation: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  requestHeaders: new Headers(),
}));

vi.mock("@tanstack/react-start", () => {
  const builder = {
    middleware: () => builder,
    validator: () => builder,
    handler: (fn: unknown) => fn,
  };
  return { createServerFn: () => builder };
});

vi.mock("@tanstack/react-start/server", () => ({
  deleteCookie: mocks.deleteCookie,
  getRequestHeaders: () => mocks.requestHeaders,
  getRequestProtocol: () => "http",
  setCookie: mocks.setCookie,
  setResponseHeader: vi.fn(),
}));

vi.mock("@/lib/server/basic-auth", () => ({ basicAuthFnMiddleware: {} }));

vi.mock("@payload-config", () => ({ default: {} }));

const usersCollection = {
  config: { auth: { cookies: { secure: false, sameSite: "Lax" }, tokenExpiration: 2592000 } },
};

vi.mock("payload", () => ({
  getPayload: async () => ({
    auth: mocks.auth,
    login: mocks.login,
    config: { cookiePrefix: "ai-explorations" },
    collections: { users: usersCollection },
  }),
  createPayloadRequest: async ({ user }: { user: unknown }) => ({ user }),
  logoutOperation: mocks.logoutOperation,
}));

const { signInFn, signOutFn } = await import("./session.functions");

const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 2592000,
  path: "/",
  sameSite: "lax",
  secure: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requestHeaders = new Headers();
});

describe("signInFn", () => {
  test("signs in through the Local API and sets only the user token cookie", async () => {
    mocks.login.mockResolvedValue({ token: "user-jwt", exp: 1, user: { id: "user-1" } });

    await expect(
      signInFn({ data: { email: "ana@example.com", password: "secret" } }),
    ).resolves.toEqual({ success: true });

    expect(mocks.login).toHaveBeenCalledWith({
      collection: "users",
      data: { email: "ana@example.com", password: "secret" },
    });
    expect(mocks.setCookie).toHaveBeenCalledTimes(1);
    expect(mocks.setCookie).toHaveBeenCalledWith(
      "ai-explorations-user-token",
      "user-jwt",
      COOKIE_OPTIONS,
    );
  });

  test("maps a failed login to a credentials error without setting a cookie", async () => {
    mocks.login.mockRejectedValue(new Error("The email or password provided is incorrect."));

    await expect(signInFn({ data: { email: "ana@example.com", password: "x" } })).resolves.toEqual({
      success: false,
      reason: "credentials",
    });
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});

describe("signOutFn", () => {
  test("clears only the user token cookie and ends that user's Payload session", async () => {
    const user = { id: "user-1", collection: "users", _sid: "sid-1" };
    mocks.auth.mockResolvedValue({ user });
    mocks.requestHeaders = new Headers({
      cookie: "ai-explorations-token=admin; ai-explorations-user-token=user.jwt.token",
    });

    await signOutFn();

    expect(mocks.deleteCookie).toHaveBeenCalledTimes(1);
    expect(mocks.deleteCookie).toHaveBeenCalledWith("ai-explorations-user-token", COOKIE_OPTIONS);
    expect(mocks.setCookie).not.toHaveBeenCalled();
    expect(mocks.auth.mock.calls[0][0].headers.get("authorization")).toBe("JWT user.jwt.token");
    expect(mocks.logoutOperation).toHaveBeenCalledWith({
      collection: usersCollection,
      req: { user },
    });
  });

  test("never ends an admin session found without a user cookie", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", collection: "admins" } });
    mocks.requestHeaders = new Headers({ cookie: "ai-explorations-token=admin" });

    await signOutFn();

    const authHeaders: Headers = mocks.auth.mock.calls[0][0].headers;
    expect(authHeaders.get("authorization")).toBeNull();
    expect(authHeaders.get("cookie")).toBeNull();
    expect(mocks.deleteCookie).toHaveBeenCalledWith("ai-explorations-user-token", COOKIE_OPTIONS);
    expect(mocks.logoutOperation).not.toHaveBeenCalled();
  });

  test("clears the user cookie even when looking up its user fails", async () => {
    mocks.auth.mockRejectedValue(new Error("database unavailable"));
    mocks.requestHeaders = new Headers({ cookie: "ai-explorations-user-token=user.jwt.token" });

    await expect(signOutFn()).rejects.toThrow("database unavailable");
    expect(mocks.deleteCookie).toHaveBeenCalledWith("ai-explorations-user-token", COOKIE_OPTIONS);
  });
});
