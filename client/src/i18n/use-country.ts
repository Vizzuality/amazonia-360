"use client";

import { usePathname } from "next/navigation";

import { countryFromPathname } from "@/lib/country";

import { routing } from "./routing";

/**
 * The active country module, or `null` for the Amazon Region — regional data, no country
 * scope. Unscoped routes (`auth`, `private`, `webshot`) carry no code, so a round trip
 * through them loses the selection.
 *
 * Deliberately the raw `usePathname`, not the locale-aware wrapper: this needs the URL the
 * browser is on, including the code that `proxy.ts` strips before Next routes the request.
 */
export function useCountry(): string | null {
  return countryFromPathname(usePathname(), routing.locales);
}
