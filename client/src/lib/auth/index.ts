import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";

import { env } from "@/env.mjs";

import { PayloadAuthAdapter } from "@/lib/auth/adapter";

import { sdk } from "@/services/sdk";

// Extend Authjs User to add collection
declare module "next-auth" {
  interface User {
    collection?: string;
    apiKey?: string | null;
  }

  interface Session {
    user: {
      id: string;
      collection?: string;
      apiKey?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    collection?: string;
  }
}

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid identifier or password";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/local-api/auth",
  trustHost: true,
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
    error: "/auth/sign-in",
  },
  adapter: PayloadAuthAdapter(),
  providers: [
    Credentials({
      id: "users",
      name: "Users",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // You can add your own logic here to validate the credentials
        return sdk
          .login({
            collection: "users",
            data: {
              email: (credentials?.email as string) || "",
              password: (credentials?.password as string) || "",
            },
          })
          .then((res) => ({
            ...res.user,
            id: String(res.user.id),
            collection: "users",
          }))
          .catch(() => {
            throw new InvalidLoginError();
          });
      },
    }),
    Credentials({
      id: "anonymous-users",
      name: "Anonymous Users",
      credentials: {},
      async authorize() {
        // For anonymous users, we just create a new anonymous user on each sign-in
        return sdk
          .create(
            {
              collection: "anonymous-users",
              data: {
                apiKey: crypto.randomUUID(),
                enableAPIKey: true,
              },
            },
            {
              headers: {
                "x-app-key": env.APP_KEY || "",
              },
            },
          )
          .then((res) => ({
            ...res,
            id: String(res.id),
            apiKey: res.apiKey,
            collection: "anonymous-users",
          }));
      },
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user || account) {
        token.collection = user.collection || "users";
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub || "",
          collection: token.collection as string | undefined,
        },
      };
    },
  },
});
