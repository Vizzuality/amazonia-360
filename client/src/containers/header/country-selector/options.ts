"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";

import { COUNTRIES, countryFlagSrc, isUnscopedPathname, withCountry } from "@/lib/country";
import { isFeatureEnabled } from "@/lib/feature-flags";

import { usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

export type CountryOption = {
  code: string | null;
  name: string;
  description: string;
  active: boolean;
  flagSrc?: string;
  href?: { pathname: string; query: Record<string, string> };
};

export function useCountryOptions(): CountryOption[] | null {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const country = useCountry();

  const query = useMemo(() => Object.fromEntries(searchParams?.entries() ?? []), [searchParams]);

  return useMemo(() => {
    // The picker is the only thing that announces the module — nine "Coming soon" countries
    // and a partnerships block — so it waits behind the flag. Scoped to the picker on
    // purpose: `lib/country.ts` also feeds `proxy.ts`, so gating there would 404 `/ECU`.
    if (!isFeatureEnabled("country-module")) return null;
    if (isUnscopedPathname(pathname)) return null;

    const toOption = (
      code: string | null,
      name: string,
      description: string,
      available: boolean,
    ) => ({
      code,
      name,
      description,
      active: code === country,
      flagSrc: code === null ? undefined : countryFlagSrc(code),
      href: available ? { pathname: withCountry(pathname, code), query } : undefined,
    });

    const amazonRegion = toOption(
      null,
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
