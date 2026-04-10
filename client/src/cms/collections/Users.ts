import type { CollectionConfig } from "payload";

import { env } from "@/env.mjs";

import { auth, signOut } from "@/lib/auth";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { userAccess } from "@/cms/access/user";
import { buildVerifyEmailHTML, VERIFY_EMAIL_SUBJECT } from "@/cms/emails/verify-email";
import { resendVerificationHandler } from "@/cms/endpoints/resend-verification";
import { beforeDeleteUser } from "@/cms/hooks/user";
import { or } from "@/cms/utils/or";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "createdAt", "verified"],
  },
  auth: {
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
    forgotPassword: {
      expiration: 24 * 60 * 60 * 1000, // 1 day
      generateEmailSubject: async () => {
        return "Reset your password";
      },
      generateEmailHTML: async (params) => {
        // Use the token provided to allow your user to reset their password
        const resetPasswordURL = `${env.NEXT_PUBLIC_URL}/auth/reset-password?token=${params?.token}`;

        return `
          <!doctype html>
        <html lang="en">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          </head>
          <body>
            <h1>Password reset instructions</h1>
            <p>
              Hello ${params?.user.email},<br /><br />
              We received a request to reset your password for your AmazoniaForever360+ account. If you did not make this request, please ignore this email.<br /><br />
              If you would like to reset your password, please click the link below:<br />
              <a href="${resetPasswordURL}">Reset your password</a><br /><br />
              Thank you!<br />
              AmazoniaForever360+ Team
            </p>
          </body>
        </html>
        `;
      },
    },
    strategies: [
      {
        name: "authjs",
        authenticate: async ({ payload }) => {
          const session = await auth();

          if (!session || !session?.user?.id) {
            return { user: null };
          }

          const user = await payload.findByID({
            collection: "users",
            id: session.user.id,
            disableErrors: true,
          });

          return { user: user ? { ...user, collection: "users" } : null };
        },
      },
    ],
  },
  access: {
    create: anyoneAccess,
    read: or(userAccess, adminAccess),
    update: or(userAccess, adminAccess),
    delete: or(userAccess, adminAccess),
  },
  fields: [
    { name: "name", type: "text" },
    { name: "image", type: "text" },
    { name: "emailVerified", type: "date" },
    {
      name: "accounts",
      type: "join",
      collection: "accounts",
      on: "user",
    },
    {
      name: "reports",
      type: "join",
      collection: "reports",
      on: "user",
    },
  ],
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
  hooks: {
    beforeDelete: [beforeDeleteUser],
  },
};
