import {
  DEFAULT_SIGNED_IN_REDIRECT,
  isSafeRedirect,
  resolveRedirect,
  stripLocale,
} from "./redirect-url";

const LOCALES = ["en", "es", "pt"] as const;

describe("stripLocale", () => {
  test("removes a leading locale segment", () => {
    expect(stripLocale("/en/reports/abc", LOCALES)).toBe("/reports/abc");
    expect(stripLocale("/pt/private/my-reports", LOCALES)).toBe("/private/my-reports");
  });

  test("preserves the query string", () => {
    expect(stripLocale("/es/reports/grid?location=xyz&buffer=60", LOCALES)).toBe(
      "/reports/grid?location=xyz&buffer=60",
    );
  });

  test("leaves an already-unprefixed path alone", () => {
    expect(stripLocale("/reports/abc", LOCALES)).toBe("/reports/abc");
  });

  test("does not mistake a path segment for a locale", () => {
    expect(stripLocale("/reports/en", LOCALES)).toBe("/reports/en");
  });

  test("handles a bare locale and an empty string", () => {
    expect(stripLocale("/en", LOCALES)).toBe("/");
    expect(stripLocale("", LOCALES)).toBe("");
  });
});

describe("isSafeRedirect", () => {
  test("accepts same-origin absolute paths", () => {
    expect(isSafeRedirect("/reports/abc", LOCALES)).toBe(true);
    expect(isSafeRedirect("/en/reports/abc", LOCALES)).toBe(true);
  });

  test("rejects empty, protocol-relative and off-origin targets", () => {
    expect(isSafeRedirect(null, LOCALES)).toBe(false);
    expect(isSafeRedirect("", LOCALES)).toBe(false);
    expect(isSafeRedirect("//evil.example.com", LOCALES)).toBe(false);
    expect(isSafeRedirect("https://evil.example.com", LOCALES)).toBe(false);
    // Browsers normalise backslashes to slashes, so these become
    // protocol-relative off-origin targets by the time a browser navigates.
    expect(isSafeRedirect("/\\evil.com", LOCALES)).toBe(false);
    expect(isSafeRedirect("/\\/evil.com", LOCALES)).toBe(false);
  });

  test("rejects auth pages so signing in cannot bounce back to itself", () => {
    expect(isSafeRedirect("/auth/sign-in", LOCALES)).toBe(false);
    // The gap: a locale prefix used to walk straight past the /auth/ guard.
    expect(isSafeRedirect("/en/auth/verify-email?token=x", LOCALES)).toBe(false);
    expect(isSafeRedirect("/pt/auth/reset-password", LOCALES)).toBe(false);
    expect(isSafeRedirect("/auth", LOCALES)).toBe(false);
  });
});

describe("resolveRedirect", () => {
  test("strips the locale from a usable target", () => {
    expect(resolveRedirect("/en/reports/grid?location=xyz")).toBe("/reports/grid?location=xyz");
    expect(resolveRedirect("/reports")).toBe("/reports");
  });

  test("falls back for anything unusable", () => {
    expect(resolveRedirect(null)).toBe(DEFAULT_SIGNED_IN_REDIRECT);
    expect(resolveRedirect("")).toBe(DEFAULT_SIGNED_IN_REDIRECT);
    expect(resolveRedirect("//evil.example.com")).toBe(DEFAULT_SIGNED_IN_REDIRECT);
    expect(resolveRedirect("https://evil.example.com")).toBe(DEFAULT_SIGNED_IN_REDIRECT);
  });

  test("falls back for a repeated query param", () => {
    expect(resolveRedirect(["/reports", "/private/profile"])).toBe(DEFAULT_SIGNED_IN_REDIRECT);
    expect(resolveRedirect([])).toBe(DEFAULT_SIGNED_IN_REDIRECT);
  });

  // `searchParams.getAll` hands over an array even for a param that appears once, so the
  // form and the guest gate have to read that the same way.
  test("reads a single-element array as the value it holds", () => {
    expect(resolveRedirect(["/en/reports"])).toBe("/reports");
  });

  test("never sends anyone back into the auth pages", () => {
    expect(resolveRedirect("/auth/sign-in")).toBe(DEFAULT_SIGNED_IN_REDIRECT);
    expect(resolveRedirect("/en/auth/sign-up")).toBe(DEFAULT_SIGNED_IN_REDIRECT);
  });
});
