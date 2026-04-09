# Resend Verification Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Resend email" button to the Check Your Email page so users can re-trigger verification emails when the first one doesn't arrive.

**Architecture:** A custom Payload CMS endpoint on the Users collection generates a new verification token and sends the email via AWS SES. The Check Your Email page receives the user's email via query parameter and calls this endpoint with a 30-second client-side cooldown.

**Tech Stack:** Payload CMS v3, Next.js 15, React 19, Zod, Sonner (toasts), next-intl, Jest + React Testing Library

**Design spec:** `docs/superpowers/specs/2026-04-09-resend-verification-email-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/cms/emails/verify-email.ts` | **New** — Shared email subject constant + HTML builder |
| `src/cms/emails/verify-email.test.ts` | **New** — Unit tests for email helper |
| `src/cms/endpoints/resend-verification.ts` | **New** — Endpoint handler (extracted for testability) |
| `src/cms/endpoints/resend-verification.test.ts` | **New** — Unit tests for endpoint handler |
| `src/cms/collections/Users.ts` | **Modify** — Use shared helper, wire resend endpoint |
| `src/containers/auth/sign-up.tsx` | **Modify** — Pass email as query param on redirect |
| `src/app/(frontend)/[locale]/(app)/auth/check-your-email/page.tsx` | **Modify** — Extract email from searchParams, pass to component |
| `src/containers/auth/check-your-email.tsx` | **Modify** — Add resend button with cooldown and toast |
| `src/containers/auth/check-your-email.test.tsx` | **New** — Unit tests for CheckYourEmail component |
| `src/i18n/translations/en.json` | **Modify** — Add 5 new keys |
| `src/i18n/translations/es.json` | **Modify** — Add 5 new keys |
| `src/i18n/translations/pt.json` | **Modify** — Add 5 new keys |

All paths relative to `client/`.

---

### Task 1: Shared Email Template Helper (TDD)

**Files:**
- Create: `src/cms/emails/verify-email.ts`
- Test: `src/cms/emails/verify-email.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/cms/emails/verify-email.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && pnpm test -- --testPathPattern="src/cms/emails/verify-email.test.ts" --no-coverage`

Expected: FAIL — `Cannot find module './verify-email'`

- [ ] **Step 3: Write the implementation**

Create `src/cms/emails/verify-email.ts`:

```typescript
import { env } from "@/env.mjs";

export const VERIFY_EMAIL_SUBJECT = "Verify your email address";

export function buildVerifyEmailHTML(params: {
  email: string;
  token: string;
}): string {
  const verifyEmailURL = `${env.NEXT_PUBLIC_URL}/auth/verify-email?token=${params.token}`;

  return `
    <!doctype html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    </head>
    <body>
      <h1>Email verification</h1>
      <p>
        Hello ${params.email},<br /><br />
        Thank you for registering an account with AmazoniaForever360+!. Please verify your email address by clicking the link below:<br />
        <a href="${verifyEmailURL}">Verify your email address</a><br /><br />
        If you did not create this account, please ignore this email.<br /><br />
        Thank you!<br />
        AmazoniaForever360+ Team
      </p>
    </body>
  </html>
  `;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && pnpm test -- --testPathPattern="src/cms/emails/verify-email.test.ts" --no-coverage`

Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add client/src/cms/emails/verify-email.ts client/src/cms/emails/verify-email.test.ts
git commit -m "feat: add shared verification email template helper"
```

---

### Task 2: Refactor Users.ts to Use Shared Helper

**Files:**
- Modify: `src/cms/collections/Users.ts` (lines 19-47)

- [ ] **Step 1: Replace inline email template with shared helper**

In `src/cms/collections/Users.ts`, add the imports at the top:

```typescript
import {
  buildVerifyEmailHTML,
  VERIFY_EMAIL_SUBJECT,
} from "@/cms/emails/verify-email";
```

Then replace the `auth.verify` block (lines 20-47) with:

```typescript
    verify: {
      generateEmailSubject: async () => {
        return VERIFY_EMAIL_SUBJECT;
      },
      generateEmailHTML: async (params) => {
        return buildVerifyEmailHTML({
          email: params.user.email,
          token: params.token,
        });
      },
    },
```

Remove the `import { env } from "@/env.mjs";` line at the top of Users.ts since it is no longer used directly (the env import is now inside the shared helper). Verify no other code in Users.ts uses `env` before removing.

- [ ] **Step 2: Run existing tests to verify no regression**

Run: `cd client && pnpm test --no-coverage`

Expected: All existing tests pass. The email HTML output is identical — only the source of the template changed.

- [ ] **Step 3: Commit**

```bash
git add client/src/cms/collections/Users.ts
git commit -m "refactor: extract verification email template to shared helper"
```

---

### Task 3: Resend Verification Endpoint Handler (TDD)

**Files:**
- Create: `src/cms/endpoints/resend-verification.ts`
- Test: `src/cms/endpoints/resend-verification.test.ts`
- Modify: `src/cms/collections/Users.ts` (endpoints array)

- [ ] **Step 1: Write the failing tests**

Create `src/cms/endpoints/resend-verification.test.ts`:

```typescript
jest.mock("@/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_URL: "http://localhost:3000",
  },
}));

jest.mock("@/cms/emails/verify-email", () => ({
  VERIFY_EMAIL_SUBJECT: "Verify your email address",
  buildVerifyEmailHTML: jest
    .fn()
    .mockReturnValue("<html>mock email</html>"),
}));

import { buildVerifyEmailHTML } from "@/cms/emails/verify-email";

import { resendVerificationHandler } from "./resend-verification";

function createMockReq(body: Record<string, unknown>) {
  return {
    payload: {
      find: jest.fn(),
      update: jest.fn(),
      sendEmail: jest.fn(),
    },
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Parameters<typeof resendVerificationHandler>[0];
}

describe("resendVerificationHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    (req.payload.find as jest.Mock).mockResolvedValue({ docs: [] });

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toContain("If an account exists");
    expect(req.payload.sendEmail).not.toHaveBeenCalled();
  });

  it("returns generic success when user is already verified", async () => {
    const req = createMockReq({ email: "verified@example.com" });
    (req.payload.find as jest.Mock).mockResolvedValue({
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
    (req.payload.find as jest.Mock).mockResolvedValue({
      docs: [
        { id: "42", email: "unverified@example.com", _verified: false },
      ],
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
    const updateCall = (req.payload.update as jest.Mock).mock.calls[0][0];
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
        find: jest.fn(),
        update: jest.fn(),
        sendEmail: jest.fn(),
      },
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Parameters<typeof resendVerificationHandler>[0];

    const response = await resendVerificationHandler(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe("Invalid request body.");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && pnpm test -- --testPathPattern="src/cms/endpoints/resend-verification.test.ts" --no-coverage`

Expected: FAIL — `Cannot find module './resend-verification'`

- [ ] **Step 3: Write the endpoint handler**

Create `src/cms/endpoints/resend-verification.ts`:

```typescript
import crypto from "crypto";

import type { PayloadHandler } from "payload";
import { z } from "zod";

import {
  buildVerifyEmailHTML,
  VERIFY_EMAIL_SUBJECT,
} from "@/cms/emails/verify-email";

const resendSchema = z.object({
  email: z.string().email(),
});

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists with that email, a verification link has been sent.";

export const resendVerificationHandler: PayloadHandler = async (req) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: "Invalid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  const { docs: users } = await req.payload.find({
    collection: "users",
    where: { email: { equals: email } },
    overrideAccess: true,
    limit: 1,
  });

  const user = users[0];

  if (!user || user._verified) {
    return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
  }

  const token = crypto.randomBytes(20).toString("hex");

  await req.payload.update({
    collection: "users",
    id: user.id,
    data: {
      _verificationToken: token,
    },
    overrideAccess: true,
  });

  const html = buildVerifyEmailHTML({ email, token });

  await req.payload.sendEmail({
    to: email,
    subject: VERIFY_EMAIL_SUBJECT,
    html,
  });

  return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && pnpm test -- --testPathPattern="src/cms/endpoints/resend-verification.test.ts" --no-coverage`

Expected: PASS — all 6 tests green

- [ ] **Step 5: Wire the endpoint into Users collection**

In `src/cms/collections/Users.ts`, add the import at the top:

```typescript
import { resendVerificationHandler } from "@/cms/endpoints/resend-verification";
```

Then add the new endpoint to the `endpoints` array (after the existing `/logout` endpoint):

```typescript
  endpoints: [
    {
      path: "/logout",
      method: "post",
      handler: async () => {
        await signOut({
          redirect: false,
        });
        return Response.json({
          message: "You have been logged out successfully.",
        });
      },
    },
    {
      path: "/resend-verification",
      method: "post",
      handler: resendVerificationHandler,
    },
  ],
```

- [ ] **Step 6: Run all tests to verify no regression**

Run: `cd client && pnpm test --no-coverage`

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add client/src/cms/endpoints/resend-verification.ts client/src/cms/endpoints/resend-verification.test.ts client/src/cms/collections/Users.ts
git commit -m "feat: add resend verification email endpoint"
```

---

### Task 4: Add i18n Translation Keys

**Files:**
- Modify: `src/i18n/translations/en.json`
- Modify: `src/i18n/translations/es.json`
- Modify: `src/i18n/translations/pt.json`

- [ ] **Step 1: Add keys to all three locale files**

In `src/i18n/translations/en.json`, add after the `"auth-toast-password-reset-failed"` key:

```json
  "auth-check-email-resend-button": "Resend email",
  "auth-check-email-resend-button-countdown": "Resend email ({seconds}s)",
  "auth-check-email-resend-toast-loading": "Sending verification email...",
  "auth-check-email-resend-toast-success": "Verification email sent",
  "auth-check-email-resend-toast-error": "Failed to send verification email",
```

In `src/i18n/translations/es.json`, add at the same position:

```json
  "auth-check-email-resend-button": "Reenviar correo electrónico",
  "auth-check-email-resend-button-countdown": "Reenviar correo electrónico ({seconds}s)",
  "auth-check-email-resend-toast-loading": "Enviando correo de verificación...",
  "auth-check-email-resend-toast-success": "Correo de verificación enviado",
  "auth-check-email-resend-toast-error": "Error al enviar correo de verificación",
```

In `src/i18n/translations/pt.json`, add at the same position:

```json
  "auth-check-email-resend-button": "Reenviar e-mail",
  "auth-check-email-resend-button-countdown": "Reenviar e-mail ({seconds}s)",
  "auth-check-email-resend-toast-loading": "Enviando e-mail de verificação...",
  "auth-check-email-resend-toast-success": "E-mail de verificação enviado",
  "auth-check-email-resend-toast-error": "Falha ao enviar e-mail de verificação",
```

- [ ] **Step 2: Commit**

```bash
git add client/src/i18n/translations/en.json client/src/i18n/translations/es.json client/src/i18n/translations/pt.json
git commit -m "feat: add resend verification email i18n keys"
```

---

### Task 5: Update Sign-Up Redirect and Page Route

**Files:**
- Modify: `src/containers/auth/sign-up.tsx` (line 68)
- Modify: `src/app/(frontend)/[locale]/(app)/auth/check-your-email/page.tsx`

- [ ] **Step 1: Pass email as query parameter from sign-up form**

In `src/containers/auth/sign-up.tsx`, change line 68 from:

```typescript
            router.push("/auth/check-your-email");
```

to:

```typescript
            router.push(`/auth/check-your-email?email=${encodeURIComponent(value.email)}`);
```

- [ ] **Step 2: Extract email from searchParams in the page route**

Replace the full content of `src/app/(frontend)/[locale]/(app)/auth/check-your-email/page.tsx` with:

```typescript
import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { CheckYourEmail } from "@/containers/auth/check-your-email";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/auth/check-your-email">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-check-your-email-page-title"),
    description: t("metadata-check-your-email-page-description"),
  };
}

export default async function CheckYourEmailPage({
  searchParams,
}: PageProps<"/[locale]/auth/check-your-email">) {
  const { email } = await searchParams;

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <CheckYourEmail
          email={typeof email === "string" ? email : undefined}
        />
      </div>
    </section>
  );
}
```

Note: `searchParams` values can be `string | string[] | undefined`. We only accept a single string value.

- [ ] **Step 3: Commit**

```bash
git add client/src/containers/auth/sign-up.tsx client/src/app/\(frontend\)/\[locale\]/\(app\)/auth/check-your-email/page.tsx
git commit -m "feat: pass email to check-your-email page via query param"
```

---

### Task 6: CheckYourEmail Component with Resend Button (TDD)

**Files:**
- Test: `src/containers/auth/check-your-email.test.tsx`
- Modify: `src/containers/auth/check-your-email.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/containers/auth/check-your-email.test.tsx`:

```typescript
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Override the global next-intl mock to return keys for readable assertions
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => key),
}));

jest.mock("sonner", () => ({
  toast: {
    promise: jest.fn((promise: Promise<unknown>) => promise.catch(() => {})),
  },
}));

jest.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { CheckYourEmail } from "./check-your-email";

describe("CheckYourEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Success" }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the card with title and description", () => {
    render(<CheckYourEmail />);

    expect(
      screen.getByText("auth-check-email-title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("auth-check-email-description"),
    ).toBeInTheDocument();
  });

  it("renders back to sign in link", () => {
    render(<CheckYourEmail />);

    expect(
      screen.getByText("auth-link-back-to-sign-in"),
    ).toBeInTheDocument();
  });

  it("does not render resend button when email is not provided", () => {
    render(<CheckYourEmail />);

    expect(
      screen.queryByText("auth-check-email-resend-button"),
    ).not.toBeInTheDocument();
  });

  it("renders resend button when email is provided", () => {
    render(<CheckYourEmail email="test@example.com" />);

    expect(
      screen.getByText("auth-check-email-resend-button"),
    ).toBeInTheDocument();
  });

  it("calls the resend endpoint when button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CheckYourEmail email="test@example.com" />);

    await user.click(screen.getByText("auth-check-email-resend-button"));

    expect(mockFetch).toHaveBeenCalledWith("/v1/api/users/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
  });

  it("disables the button and shows countdown after clicking", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CheckYourEmail email="test@example.com" />);

    await user.click(screen.getByText("auth-check-email-resend-button"));

    // Button should now show countdown text and be disabled
    const button = screen.getByText(
      "auth-check-email-resend-button-countdown",
    );
    expect(button.closest("button")).toBeDisabled();
  });

  it("re-enables the button after cooldown expires", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CheckYourEmail email="test@example.com" />);

    await user.click(screen.getByText("auth-check-email-resend-button"));

    // Fast-forward past the 30-second cooldown
    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    await waitFor(() => {
      const button = screen.getByText("auth-check-email-resend-button");
      expect(button.closest("button")).not.toBeDisabled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && pnpm test -- --testPathPattern="src/containers/auth/check-your-email.test.tsx" --no-coverage`

Expected: FAIL — component does not accept `email` prop or have a resend button

- [ ] **Step 3: Write the updated component**

Replace the full content of `src/containers/auth/check-your-email.tsx` with:

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Link } from "@/i18n/navigation";

const COOLDOWN_SECONDS = 30;

interface CheckYourEmailProps extends React.ComponentProps<"div"> {
  email?: string;
}

export function CheckYourEmail({ email, ...props }: CheckYourEmailProps) {
  const t = useTranslations();
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCountdown(COOLDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResend = useCallback(() => {
    if (!email || countdown > 0) return;

    startCooldown();

    toast.promise(
      fetch("/v1/api/users/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((res) => {
        if (!res.ok) throw new Error("Request failed");
      }),
      {
        loading: t("auth-check-email-resend-toast-loading"),
        success: t("auth-check-email-resend-toast-success"),
        error: t("auth-check-email-resend-toast-error"),
        duration: 2000,
      },
    );
  }, [email, countdown, startCooldown, t]);

  return (
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">
          {t("auth-check-email-title")}
        </CardTitle>
        <CardDescription className="font-medium">
          {t("auth-check-email-description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/auth/sign-in">
          <Button size="lg" className="w-full">
            {t("auth-link-back-to-sign-in")}
          </Button>
        </Link>
        {email && (
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleResend}
            disabled={countdown > 0}
          >
            {countdown > 0
              ? t("auth-check-email-resend-button-countdown", {
                  seconds: countdown,
                })
              : t("auth-check-email-resend-button")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd client && pnpm test -- --testPathPattern="src/containers/auth/check-your-email.test.tsx" --no-coverage`

Expected: PASS — all 7 tests green

- [ ] **Step 5: Run all tests to verify no regression**

Run: `cd client && pnpm test --no-coverage`

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add client/src/containers/auth/check-your-email.tsx client/src/containers/auth/check-your-email.test.tsx
git commit -m "feat: add resend verification email button with cooldown"
```

---

### Note: E2E Tests Deferred

The design spec includes E2E tests, but the Playwright infrastructure does not exist in the client yet (no `playwright.config.ts`, no `e2e/` directory). E2E tests for the resend flow should be added when Playwright is set up for the project. The unit tests in Tasks 1, 3, and 6 provide coverage for the critical logic paths in the meantime.

---

### Task 7: Final Verification

- [ ] **Step 1: Run linting**

Run: `cd client && pnpm lint`

Expected: No errors. Fix any issues if they appear.

- [ ] **Step 2: Run type checking**

Run: `cd client && pnpm check-types`

Expected: No errors. If `_verificationToken` causes a type error in the endpoint handler, add a `// @ts-expect-error -- internal Payload auth field` comment above the offending line.

- [ ] **Step 3: Run full test suite**

Run: `cd client && pnpm test`

Expected: All tests pass with coverage report.
