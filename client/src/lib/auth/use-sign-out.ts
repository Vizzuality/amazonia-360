"use client";

import { useCallback } from "react";

import { signOut } from "next-auth/react";
import { useLocale } from "next-intl";

import { resolveCountryHref } from "@/lib/country";

import { getPathname } from "@/i18n/navigation-client";
import { useCountry } from "@/i18n/use-country";

/**
 * The only way to sign out. Two constraints meet here and only this combination satisfies
 * both, which is why call sites must not assemble it themselves:
 *
 * - The client helper is what clears `SessionProvider`. Nothing else can: `useSession`'s
 *   `update()` ignores an empty response, so it can log you in but never out.
 * - That helper writes the cookie over a plain fetch, which leaves the client Router Cache
 *   holding every gated page this session visited. So the navigation after it has to be a
 *   full load, or those pages stay one Back button away from rendering to a signed-out
 *   user. `redirect: true` is exactly that full load.
 *
 * Signing in has the mirror problem and the opposite answer — it runs as a Server Action,
 * where mutating the cookie makes Next evict that cache for us.
 */
export function useSignOut() {
  const locale = useLocale();
  const country = useCountry();

  return useCallback(
    (href: string = "/") =>
      signOut({
        redirect: true,
        redirectTo: getPathname({ href: resolveCountryHref(href, country), locale }),
      }),
    [country, locale],
  );
}
