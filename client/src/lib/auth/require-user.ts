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
 *
 * Served to a prefetch, this redirect lands in the client Router Cache under the
 * gated route's own key, where a later soft navigation would replay it. Signing in
 * therefore runs as a Server Action: mutating the session cookie makes Next evict
 * that cache before the navigation happens — see `auth/sign-in/actions`.
 */
export async function requireUser(locale: Locale) {
  const session = await auth();

  if (session?.user?.collection === "users") return session;

  const headersList = await headers();
  const currentUrl = headersList.get("x-current-url") || headersList.get("x-current-path") || "";
  const redirectUrl = encodeURIComponent(stripLocale(currentUrl, routing.locales));

  redirect({ locale, href: `/auth/sign-in?redirectUrl=${redirectUrl}` });
}
