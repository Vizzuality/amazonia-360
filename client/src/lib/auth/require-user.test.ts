import { requireUser } from "./require-user";

const { authMock, redirectMock, getMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => ({ get: getMock })) }));
vi.mock("@/i18n/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es", "pt"], defaultLocale: "en" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  getMock.mockReturnValue("");
});

describe("requireUser", () => {
  test("returns the session for a signed-in user", async () => {
    const session = { user: { id: "user-1", collection: "users" } };
    authMock.mockResolvedValue(session);

    await expect(requireUser("en")).resolves.toBe(session);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test("redirects when there is no session", async () => {
    authMock.mockResolvedValue(null);
    getMock.mockReturnValue("/en/reports/abc");

    await requireUser("en");

    expect(redirectMock).toHaveBeenCalledWith({
      locale: "en",
      href: `/auth/sign-in?redirectUrl=${encodeURIComponent("/reports/abc")}`,
    });
  });

  test("redirects a stale anonymous session", async () => {
    authMock.mockResolvedValue({ user: { id: "anon-1", collection: "anonymous-users" } });
    getMock.mockReturnValue("/en/reports/abc");

    await requireUser("en");

    expect(redirectMock).toHaveBeenCalled();
  });

  test("keeps the query string and the requested locale in the return URL", async () => {
    authMock.mockResolvedValue(null);
    getMock.mockReturnValue("/pt/reports/grid?location=xyz");

    await requireUser("pt");

    expect(redirectMock).toHaveBeenCalledWith({
      locale: "pt",
      href: `/auth/sign-in?redirectUrl=${encodeURIComponent("/reports/grid?location=xyz")}`,
    });
  });

  test("falls back to x-current-path when x-current-url is absent", async () => {
    authMock.mockResolvedValue(null);
    getMock.mockImplementation((name: string) =>
      name === "x-current-path" ? "/en/reports" : null,
    );

    await requireUser("en");

    expect(redirectMock).toHaveBeenCalledWith({
      locale: "en",
      href: `/auth/sign-in?redirectUrl=${encodeURIComponent("/reports")}`,
    });
  });
});
