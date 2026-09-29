"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";

import {
  COUNTRIES,
  countryFlagSrc,
  isSavedReportPathname,
  isUnscopedPathname,
  withCountry,
} from "@/lib/country";
import { getCountryModulePartnerLogos } from "@/lib/country/partners";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useGetDefaultIndicators } from "@/lib/indicators";

import { usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

const LIVE_COUNTRY_CODES = COUNTRIES.filter((entry) => entry.available).map((entry) => entry.code);

export type CountryOption = {
  code: string | null;
  name: string;
  description: string;
  active: boolean;
  isDescriptionLoading: boolean;
  flagSrc?: string;
  href: { pathname: string; query: Record<string, string> };
};

export function useCountryOptions(): CountryOption[] | null {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const country = useCountry();
  const { data: indicators } = useGetDefaultIndicators({ locale, country: LIVE_COUNTRY_CODES });

  const query = useMemo(() => Object.fromEntries(searchParams?.entries() ?? []), [searchParams]);

  return useMemo(() => {
    if (!isFeatureEnabled("country-module")) return null;
    if (isUnscopedPathname(pathname) || isSavedReportPathname(pathname)) return null;

    const amazonRegion: CountryOption = {
      code: null,
      name: t("country-module-amazon-region-name"),
      description: t("country-module-amazon-region-description"),
      active: country === null,
      isDescriptionLoading: false,
      href: { pathname, query },
    };

    const countries = COUNTRIES.filter((entry) => entry.available).map(
      (entry): CountryOption => ({
        code: entry.code,
        name: t(entry.nameKey),
        description: indicators
          ? t("country-module-country-description", {
              count: indicators.filter((indicator) => indicator.country === entry.code).length,
              partners: getCountryModulePartnerLogos(entry.code).length,
            })
          : "",
        active: entry.code === country,
        isDescriptionLoading: !indicators,
        flagSrc: countryFlagSrc(entry.code),
        href: { pathname: withCountry(pathname, entry.code), query },
      }),
    );

    return [amazonRegion, ...countries];
  }, [t, pathname, query, country, indicators]);
}
