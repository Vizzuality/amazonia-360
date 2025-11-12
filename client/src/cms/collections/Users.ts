import type { CollectionConfig } from "payload";

import { env } from "@/env.mjs";

import { auth, signOut } from "@/lib/auth";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { userAccess } from "@/cms/access/user";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    forgotPassword: {
      expiration: 24 * 60 * 60 * 1000, // 1 day
      generateEmailSubject: async () => {
        return "Reset your password";
      },
      generateEmailHTML: async (params) => {
        // Use the token provided to allow your user to reset their password
        const resetPasswordURL = `${env.NEXT_PUBLIC_URL}/auth/reset-password?token=${params?.token}`;

        console.log("Reset password URL:", resetPasswordURL);

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
              We received a request to reset your password for your Amazonia 360 Forever+ account. If you did not make this request, please ignore this email.<br /><br />
              If you would like to reset your password, please click the link below:<br />
              <a href="${resetPasswordURL}">Reset your password</a><br /><br />
              Thank you!<br />
              Amazonia 360 Forever+ Team
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
            id: Number(session.user.id),
            disableErrors: true,
          });

          return { user: user ? { ...user, collection: "users" } : null };
        },
      },
    ],
  },
  access: {
    create: anyoneAccess,
    read: userAccess,
    update: userAccess,
    delete: adminAccess,
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
  ],
};
