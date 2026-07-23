/**
 * @vitest-environment node
 */

import { vi, Mock } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_URL: "http://localhost:3000",
  },
}));

vi.mock("@/cms/emails/verify-email", () => ({
  VERIFY_EMAIL_SUBJECT: "Verify your email address",
  buildVerifyEmailHTML: vi.fn().mockReturnValue("<html>mock email</html>"),
}));

import { buildVerifyEmailHTML } from "@/cms/emails/verify-email";

import { resendVerificationHandler } from "./resend-verification";

function createMockReq(body: Record<string, unknown>) {
  return {
    payload: {
      find: vi.fn(),
      update: vi.fn(),
      sendEmail: vi.fn(),
    },
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Parameters<typeof resendVerificationHandler>[0];
}

describe("resendVerificationHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const req = createMockReq({});

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Invalid email address.");
  });

  it("returns 400 when email is invalid", async () => {
    const req = createMockReq({ email: "not-an-email" });

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Invalid email address.");
  });

  it("returns generic success when user is not found", async () => {
    const req = createMockReq({ email: "unknown@example.com" });
    (req.payload.find as Mock).mockResolvedValue({ docs: [] });

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toContain("If an account exists");
    expect(req.payload.sendEmail).not.toHaveBeenCalled();
  });

  it("returns generic success when user is already verified", async () => {
    const req = createMockReq({ email: "verified@example.com" });
    (req.payload.find as Mock).mockResolvedValue({
      docs: [{ id: "1", email: "verified@example.com", _verified: true }],
    });

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toContain("If an account exists");
    expect(req.payload.sendEmail).not.toHaveBeenCalled();
  });

  it("generates a new token, updates user, and sends email for unverified user", async () => {
    const req = createMockReq({ email: "unverified@example.com" });
    (req.payload.find as Mock).mockResolvedValue({
      docs: [{ id: "42", email: "unverified@example.com", _verified: false }],
    });

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toContain("If an account exists");

    // Verify token was updated
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: "42",
        data: expect.objectContaining({
          _verificationToken: expect.any(String),
        }),
        overrideAccess: true,
      }),
    );

    // Verify the token is a 40-char hex string (20 random bytes)
    const updateCall = (req.payload.update as Mock).mock.calls[0][0];
    expect(updateCall.data._verificationToken).toMatch(/^[a-f0-9]{40}$/);

    // Verify email was built with the new token
    expect(buildVerifyEmailHTML).toHaveBeenCalledWith({
      email: "unverified@example.com",
      token: updateCall.data._verificationToken,
    });

    // Verify email was sent
    expect(req.payload.sendEmail).toHaveBeenCalledWith({
      to: "unverified@example.com",
      subject: "Verify your email address",
      html: "<html>mock email</html>",
    });
  });

  it("returns 400 when request body is not valid JSON", async () => {
    const req = {
      payload: {
        find: vi.fn(),
        update: vi.fn(),
        sendEmail: vi.fn(),
      },
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Parameters<typeof resendVerificationHandler>[0];

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Invalid request body.");
  });
});
