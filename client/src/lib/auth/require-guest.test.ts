import { requireGuest } from "./require-guest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/i18n/navigation", () => ({ redirect: redirectMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireGuest", () => {
  test("lets a signed-out visitor see the form", async () => {
    authMock.mockResolvedValue(null);

    await requireGuest("en", "/reports");

    expect(redirectMock).not.toHaveBeenCalled();
  });

  test("lets a stale anonymous session see the form", async () => {
    authMock.mockResolvedValue({ user: { id: "anon-1", collection: "anonymous-users" } });

    await requireGuest("en", "/reports");

    expect(redirectMock).not.toHaveBeenCalled();
  });

  // Where it sends them is `resolveRedirect`'s policy, covered in redirect-url.test.ts.
  test("sends a signed-in user on to the resolved target", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", collection: "users" } });

    await requireGuest("pt", "/pt/reports/grid?location=xyz");

    expect(redirectMock).toHaveBeenCalledWith({
      locale: "pt",
      href: "/reports/grid?location=xyz",
    });
  });
});
