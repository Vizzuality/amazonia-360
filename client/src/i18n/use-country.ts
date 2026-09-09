"use client";

import { usePathname } from "next/navigation";

import { countryFromPathname } from "@/lib/country";

import { routing } from "./routing";

/**
 * The active country, read from the URL. Unscoped routes (`auth`, `private`, `webshot`)
 * carry no country segment, so they read as the Amazon Region — which is why a round trip
 * through them loses the selection.
 *
 * `usePathname` is what makes a silent switch visible: `history.pushState` updates it
 * (and so re-renders every reader) without touching the rendered route.
 */
export function useCountry(): string {
  return countryFromPathname(usePathname(), routing.locales);
}
