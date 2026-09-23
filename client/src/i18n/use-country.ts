"use client";

import { usePathname } from "next/navigation";

import { CountryCode, countryFromPathname } from "@/lib/country";

import { routing } from "./routing";

// The raw `usePathname`, not the locale-aware wrapper: this needs the URL the browser is
// on, including the code that `proxy.ts` strips before Next routes the request.
export function useCountry(): CountryCode | null {
  return countryFromPathname(usePathname(), routing.locales);
}
