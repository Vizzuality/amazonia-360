"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";

import {
  AMAZON_REGION,
  COUNTRIES,
  countryFlagSrc,
  isUnscopedPathname,
  withCountry,
} from "@/lib/country";

import { usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

export type CountryOption = {
  segment: string;
  name: string;
  description: string;
  active: boolean;
  /** `undefined` for the Amazon Region, which shows a globe instead. */
  flagSrc?: string;
  /** `undefined` for a country that is configured but not yet available. */
  href?: { pathname: string; query: Record<string, string> };
};

/**
 * The rows the picker shows, in the order it shows them: the Amazon Region, then live
 * countries, then the ones still coming. Every row that can be entered carries a real
 * href for the current path under a different country — which is what a new tab and "copy
 * link address" hand out, and where `module-switch.ts` reads the path to push. A module
 * that is not yet available gets no href at all, which is what keeps it out of reach from
 * the client.
 *
 * `null` on routes that carry no country — there is nothing to show and nothing to
 * switch, which is why the selection is lost on a round trip through them.
 */
export function useCountryOptions(): CountryOption[] | null {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const country = useCountry();

  const query = useMemo(() => Object.fromEntries(searchParams?.entries() ?? []), [searchParams]);

  return useMemo(() => {
    if (isUnscopedPathname(pathname)) return null;

    const toOption = (segment: string, name: string, description: string, available: boolean) => ({
      segment,
      name,
      description,
      active: segment === country,
      flagSrc: segment === AMAZON_REGION ? undefined : countryFlagSrc(segment),
      href: available ? { pathname: withCountry(pathname, segment), query } : undefined,
    });

    const amazonRegion = toOption(
      AMAZON_REGION,
      t("country-module-amazon-region-name"),
      t("country-module-amazon-region-description"),
      true,
    );

    const countries = COUNTRIES.map((entry) => {
      const name = t(entry.nameKey);
      return toOption(
        entry.code,
        name,
        t("country-module-country-description", { name }),
        entry.available,
      );
    }).sort((a, b) => Number(!a.href) - Number(!b.href));

    return [amazonRegion, ...countries];
  }, [t, pathname, query, country]);
}
