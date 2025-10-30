import NextAuth from "next-auth";
import Github from "next-auth/providers/github";

import { PayloadAuthAdapter } from "@/lib/auth/adapter";

import config from "@/payload.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/local-api/auth",
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
    error: "/auth/error",
  },
  adapter: await PayloadAuthAdapter({ config: await config }),
  providers: [
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
});
