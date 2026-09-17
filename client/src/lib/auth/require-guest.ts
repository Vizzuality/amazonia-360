import type { Locale } from "next-intl";

import { auth } from "@/lib/auth";
import { resolveRedirect } from "@/lib/auth/redirect-url";

import { redirect } from "@/i18n/navigation";

/**
 * Gate for the sign-in and sign-up pages, and the server-side backstop for a client
 * that believes it is signed out when it is not: without it, any client-side bounce
 * back here leaves the user at a login form they have already passed.
 *
 * Deliberately not applied to the rest of `auth/`: verify-email and reset-password are
 * reached from an email link and stay open to a signed-in user.
 *
 * Mirrors `requireUser`'s `collection === "users"` check — see there for why.
 */
export async function requireGuest(locale: Locale, redirectUrl?: string | string[]) {
  const session = await auth();

  if (session?.user?.collection !== "users") return;

  // `resolveRedirect` rejects any /auth/* target, so this cannot bounce back here.
  redirect({ locale, href: resolveRedirect(redirectUrl) });
}
