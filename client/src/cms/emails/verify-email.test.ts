jest.mock("@/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_URL: "http://localhost:3000",
  },
}));

import { buildVerifyEmailHTML, VERIFY_EMAIL_SUBJECT } from "./verify-email";

describe("verify-email", () => {
  describe("VERIFY_EMAIL_SUBJECT", () => {
    it("returns the expected subject line", () => {
      expect(VERIFY_EMAIL_SUBJECT).toBe("Verify your email address");
    });
  });

  describe("buildVerifyEmailHTML", () => {
    it("includes the verification URL with the provided token", () => {
      const html = buildVerifyEmailHTML({
        email: "test@example.com",
        token: "abc123",
      });

      expect(html).toContain(
        "http://localhost:3000/auth/verify-email?token=abc123",
      );
    });

    it("includes the user email in the greeting", () => {
      const html = buildVerifyEmailHTML({
        email: "test@example.com",
        token: "abc123",
      });

      expect(html).toContain("test@example.com");
    });

    it("returns a complete HTML document", () => {
      const html = buildVerifyEmailHTML({
        email: "test@example.com",
        token: "abc123",
      });

      expect(html).toContain("<!doctype html>");
      expect(html).toContain("</html>");
    });

    it("includes the clickable verification link", () => {
      const html = buildVerifyEmailHTML({
        email: "test@example.com",
        token: "token456",
      });

      expect(html).toContain(
        '<a href="http://localhost:3000/auth/verify-email?token=token456">',
      );
    });
  });
});
