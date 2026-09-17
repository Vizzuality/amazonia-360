"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";

/** `signIn` may hand back a relative URL; `URL` needs a base to parse one. */
const FALLBACK_ORIGIN = "http://localhost";

export type SignInResult =
  | { success: true }
  | { success: false; reason: "credentials" | "unknown" };

/**
 * Signing in has to go through a Server Action rather than `signIn` from
 * `next-auth/react`: the client helper posts to the auth route handler, so the session
 * cookie arrives on a plain fetch that Next's router never sees. Set here it goes through
 * `cookies()`, and Next answers a cookie-mutating action by evicting the whole client
 * Router Cache before the action resolves. Only that makes the navigation afterwards safe
 * — see the note in `require-user`.
 */
export async function signInAction(credentials: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  try {
    // `redirect: false` keeps the navigation on the client, where the country segment and
    // the `redirectUrl` param are known. The cookie is written either way.
    const result = await signIn("users", { ...credentials, redirect: false });

    // `@auth/core` re-throws only an AuthError; anything else (a bad AUTH_SECRET, a
    // failing adapter) it swallows and hands back as a URL pointing at the error page.
    // Read as success that would set no cookie and send the user into the very redirect
    // loop this action exists to prevent.
    if (typeof result === "string" && new URL(result, FALLBACK_ORIGIN).searchParams.has("error")) {
      return { success: false, reason: "unknown" };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        reason: error.type === "CredentialsSignin" ? "credentials" : "unknown",
      };
    }

    console.error("[sign-in] unexpected failure", error);
    return { success: false, reason: "unknown" };
  }

  return { success: true };
}
