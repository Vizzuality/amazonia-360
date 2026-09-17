import { signInAction } from "./actions";

// `next-auth` is stubbed rather than imported: loading it for real pulls `next/server`
// into the module graph, which vitest cannot resolve. The stub keeps the class identity
// the action's `instanceof` check relies on.
const { signInMock, AuthErrorStub, CredentialsSigninStub } = vi.hoisted(() => {
  class AuthErrorStub extends Error {
    type = "AuthError";
  }
  class CredentialsSigninStub extends AuthErrorStub {
    type = "CredentialsSignin";
  }

  return { signInMock: vi.fn(), AuthErrorStub, CredentialsSigninStub };
});

vi.mock("next-auth", () => ({ AuthError: AuthErrorStub }));
vi.mock("@/lib/auth", () => ({ signIn: signInMock }));

const CREDENTIALS = { email: "user@example.com", password: "hunter2hunter2" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signInAction", () => {
  test("signs in without redirecting, leaving the navigation to the client", async () => {
    signInMock.mockResolvedValue("/");

    await expect(signInAction(CREDENTIALS)).resolves.toEqual({ success: true });

    expect(signInMock).toHaveBeenCalledWith("users", { ...CREDENTIALS, redirect: false });
  });

  // @auth/core swallows a non-AuthError and returns the error page's URL instead.
  test("treats a returned error URL as a failure, not a silent success", async () => {
    signInMock.mockResolvedValue("http://localhost:3000/auth/sign-in?error=Configuration");

    await expect(signInAction(CREDENTIALS)).resolves.toEqual({
      success: false,
      reason: "unknown",
    });
  });

  test("accepts a relative callback URL without an error param", async () => {
    signInMock.mockResolvedValue("/private/my-reports");

    await expect(signInAction(CREDENTIALS)).resolves.toEqual({ success: true });
  });

  test("reports bad credentials back to the form", async () => {
    signInMock.mockRejectedValue(new CredentialsSigninStub());

    await expect(signInAction(CREDENTIALS)).resolves.toEqual({
      success: false,
      reason: "credentials",
    });
  });

  test("does not blame the user for any other auth failure", async () => {
    const misconfigured = new AuthErrorStub();
    misconfigured.type = "Configuration";
    signInMock.mockRejectedValue(misconfigured);

    await expect(signInAction(CREDENTIALS)).resolves.toEqual({
      success: false,
      reason: "unknown",
    });
  });

  test("swallows an unexpected failure so the form can still show its error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    signInMock.mockRejectedValue(new Error("the database is on fire"));

    await expect(signInAction(CREDENTIALS)).resolves.toEqual({
      success: false,
      reason: "unknown",
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
