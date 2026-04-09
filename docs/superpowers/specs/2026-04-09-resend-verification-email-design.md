# Resend Verification Email

## Problem

When a user signs up, Payload CMS sends a verification email via AWS SES. If the email doesn't arrive (spam filter, delay, typo-free but slow delivery), the user has no way to request another one. The "Check Your Email" page is a dead end with only a "Back to sign in" link.

## Solution

Add a "Resend email" button to the "Check Your Email" page, backed by a custom Payload endpoint that generates a new verification token and re-sends the email.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Resend button location | "Check Your Email" page only | Most natural place — user just signed up |
| Email delivery to page | Query parameter (`?email=...`) | Simple, stateless, follows existing patterns |
| Rate limiting | Client-side 30s cooldown only | AWS SES has its own limits; endpoint is naturally protected (unverified users only, generic responses) |
| Architecture | Custom Payload endpoint on Users collection | Follows existing pattern (`/logout` endpoint); keeps auth logic co-located |

## Design

### 1. Custom Endpoint

**`POST /v1/api/users/resend-verification`** on the Users collection (Payload API base is `/v1/api/`).

**Request body:**
```json
{ "email": "user@example.com" }
```

**Handler logic:**
1. Parse and validate the `email` from the request body via Zod
2. Find user by email: `payload.find({ collection: "users", where: { email: { equals: email } }, overrideAccess: true })`
3. If user not found OR already verified (`_verified === true`): return generic `200 { message: "If an account exists with that email, a verification link has been sent." }`
4. Generate a new token: `crypto.randomBytes(20).toString("hex")`
5. Update the user: `payload.update({ collection: "users", id: user.id, data: { _verificationToken: token }, overrideAccess: true })`
6. Build verification email HTML via shared helper
7. Send email: `payload.sendEmail({ to: email, subject: VERIFY_EMAIL_SUBJECT, html })`
8. Return `200 { message: "If an account exists with that email, a verification link has been sent." }`

**Security:**
- Generic response regardless of outcome (prevents email enumeration)
- `overrideAccess: true` so endpoint works without auth
- No sensitive data in error messages

### 2. Shared Email Template Helper

**New file:** `client/src/cms/emails/verify-email.ts`

Extracts the verification email subject and HTML builder from `Users.ts` into a reusable module:

```typescript
export const VERIFY_EMAIL_SUBJECT = "Verify your email address";

export function buildVerifyEmailHTML(params: { email: string; token: string }): string {
  const verifyEmailURL = `${env.NEXT_PUBLIC_URL}/auth/verify-email?token=${params.token}`;
  // Returns the branded HTML email template
}
```

Both the `auth.verify.generateEmailHTML` callback in `Users.ts` and the resend endpoint use this helper, keeping the template as a single source of truth.

### 3. Frontend Changes

#### Sign-up form (`containers/auth/sign-up.tsx`)

Pass email as query parameter on redirect:

```typescript
// Before
router.push("/auth/check-your-email");

// After  
router.push(`/auth/check-your-email?email=${encodeURIComponent(value.email)}`);
```

#### Check Your Email page route (`auth/check-your-email/page.tsx`)

Accept `searchParams`, extract `email`, and pass it to the component as a prop.

#### Check Your Email component (`containers/auth/check-your-email.tsx`)

Transform from static card to interactive component:

- Accept `email` prop (optional)
- Add "Resend email" button below existing "Back to sign in" link
- On click: `fetch("/v1/api/users/resend-verification", ...)` with the email in the body
- 30-second cooldown: disable button and show countdown ("Resend email (27s)")
- Toast notifications via Sonner: loading, success, error (matching existing auth patterns)
- If no email prop: hide the resend button (graceful fallback)

### 4. i18n Translation Keys

New keys across all 3 locales (en, es, pt):

| Key | English | Spanish | Portuguese |
|---|---|---|---|
| `auth-check-email-resend-button` | Resend email | Reenviar correo electrónico | Reenviar e-mail |
| `auth-check-email-resend-button-countdown` | Resend email ({seconds}s) | Reenviar correo electrónico ({seconds}s) | Reenviar e-mail ({seconds}s) |
| `auth-check-email-resend-toast-loading` | Sending verification email... | Enviando correo de verificación... | Enviando e-mail de verificação... |
| `auth-check-email-resend-toast-success` | Verification email sent | Correo de verificación enviado | E-mail de verificação enviado |
| `auth-check-email-resend-toast-error` | Failed to send verification email | Error al enviar correo de verificación | Falha ao enviar e-mail de verificação |

### 5. Testing

**Unit tests:**
- Resend endpoint: user not found returns generic success, already-verified returns generic success, unverified user triggers token generation + email send
- `buildVerifyEmailHTML`: returns valid HTML with correct URL and email
- `CheckYourEmail` component: resend button renders when email present, hides when absent, disables during cooldown, countdown timer decrements

**E2E tests:**
- Full resend flow: sign up, land on check-your-email, click resend, verify toast and cooldown behavior

## Files Changed

| File | Change |
|---|---|
| `client/src/cms/emails/verify-email.ts` | **New** — shared email subject + HTML builder |
| `client/src/cms/collections/Users.ts` | Add resend endpoint; refactor `generateEmailHTML`/`generateEmailSubject` to use shared helper |
| `client/src/containers/auth/sign-up.tsx` | Pass email as query param on redirect |
| `client/src/app/(frontend)/[locale]/(app)/auth/check-your-email/page.tsx` | Accept searchParams, pass email to component |
| `client/src/containers/auth/check-your-email.tsx` | Add resend button with cooldown, toast, and API call |
| `client/src/i18n/translations/en.json` | Add 5 new translation keys |
| `client/src/i18n/translations/es.json` | Add 5 new translation keys |
| `client/src/i18n/translations/pt.json` | Add 5 new translation keys |
| Test files | Unit + E2E tests for endpoint, helper, and component |
