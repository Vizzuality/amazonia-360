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
      name: "Credentials",
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
    async session({ session, token }) {
      return { ...session, user: { ...session.user, id: token.sub } };
    },
  },
});
