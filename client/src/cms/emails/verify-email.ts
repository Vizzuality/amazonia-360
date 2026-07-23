import { env } from "@/env.mjs";

export const VERIFY_EMAIL_SUBJECT = "Verify your email address";

export function buildVerifyEmailHTML(params: { email: string; token: string }): string {
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
