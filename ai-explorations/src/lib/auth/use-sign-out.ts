"use client";

import { useCallback } from "react";

import { useLocale } from "use-intl";

import { signOut } from "@/lib/auth/react";
import { resolveCountryHref } from "@/lib/country";
import { useGetActiveModuleSlugs } from "@/lib/country-modules";

import { getPathname } from "@/i18n/navigation-client";
import { useCountry } from "@/i18n/use-country";

/**
 * Signs out with a full page load, so no gated page rendered in this session stays in memory.
 */
export function useSignOut() {
  const locale = useLocale();
  const country = useCountry();
  const liveSlugs = useGetActiveModuleSlugs();

  return useCallback(
    (href: string = "/") =>
      signOut({
        redirect: true,
        redirectTo: getPathname({ href: resolveCountryHref(href, country, liveSlugs), locale }),
      }),
    [country, liveSlugs, locale],
  );
}
