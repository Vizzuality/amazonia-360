import { isSafeRedirect, stripLocale } from "./redirect-url";

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
  });

  test("rejects auth pages so signing in cannot bounce back to itself", () => {
    expect(isSafeRedirect("/auth/sign-in", LOCALES)).toBe(false);
    // The gap: a locale prefix used to walk straight past the /auth/ guard.
    expect(isSafeRedirect("/en/auth/verify-email?token=x", LOCALES)).toBe(false);
    expect(isSafeRedirect("/pt/auth/reset-password", LOCALES)).toBe(false);
  });
});
