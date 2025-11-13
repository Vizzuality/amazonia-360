import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";

import { PayloadAuthAdapter } from "@/lib/auth/adapter";

import { sdk } from "@/services/sdk";

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
        const res = await sdk.login({
          collection: "users",
          data: {
            email: (credentials?.email as string) || "",
            password: (credentials?.password as string) || "",
          },
        });

        if (res.user) {
          return {
            ...res.user,
            id: String(res.user.id),
            collection: "users",
          };
        } else {
          throw new InvalidLoginError();
        }
      },
    }),
    Credentials({
      id: "anonymous-users",
      name: "Anonymous Users",
      credentials: {},
      async authorize() {
        // For anonymous users, we just create a new anonymous user on each sign-in
        const res = await sdk.create(
          {
            collection: "anonymous-users",
            data: {
              apiKey: crypto.randomUUID(),
              enableAPIKey: true,
            },
          },
          {
            headers: {
              "x-app-key": process.env.APP_KEY || "",
            },
          },
        );

        if (res) {
          return {
            ...res,
            id: String(res.id),
            apiKey: res.apiKey,
            collection: "anonymous-users",
          };
        } else {
          throw new InvalidLoginError();
        }
      },
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token, user }) {
      console.log("Session callback:", { session, token, user });
      return { ...session, user: { ...session.user, id: token.sub, collection: token.collection } };
    },
  },
});
