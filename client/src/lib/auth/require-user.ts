import { headers } from "next/headers";

import type { Locale } from "next-intl";

import { auth } from "@/lib/auth";
import { stripLocale } from "@/lib/auth/redirect-url";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Gate for every route that requires a real account.
 *
 * Checks `collection === "users"` rather than merely "a session exists", so a
 * stale anonymous JWT left in a cookie jar after the anonymous teardown does
 * not pass. Admins authenticate through Payload's local strategy inside
 * /admin and never hold a NextAuth session, so they are not affected.
 */
export async function requireUser(locale: Locale) {
  const session = await auth();

  if (session?.user?.collection === "users") return session;

  const headersList = await headers();
  const currentUrl = headersList.get("x-current-url") || headersList.get("x-current-path") || "";
  const redirectUrl = encodeURIComponent(stripLocale(currentUrl, routing.locales));

  redirect({ locale, href: `/auth/sign-in?redirectUrl=${redirectUrl}` });
}
