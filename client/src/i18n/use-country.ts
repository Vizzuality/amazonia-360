"use client";

import { usePathname } from "next/navigation";

import { countryFromPathname } from "@/lib/country";
import { useGetActiveModuleSlugs } from "@/lib/country-modules/queries";
import { isFeatureEnabled } from "@/lib/feature-flags";

import { routing } from "./routing";

// The raw `usePathname`, not the locale-aware wrapper: this needs the URL the browser is
// on, including the slug that `proxy.ts` strips before Next routes the request.
export function useCountry(): string | null {
  const country = countryFromPathname(usePathname(), routing.locales, useGetActiveModuleSlugs());
  return isFeatureEnabled("country-module") ? country : null;
}
