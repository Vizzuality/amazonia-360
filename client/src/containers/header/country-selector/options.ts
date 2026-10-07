"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";

import {
  countryFlagSrc,
  isSavedReportPathname,
  isUnscopedPathname,
  withCountry,
} from "@/lib/country";
import {
  CountryBoundary,
  getCountryCoverageRatio,
  useGetLiveCountryBoundaries,
} from "@/lib/country/coverage";
import {
  getModulePartners,
  useGetActiveModuleSlugs,
  useGetCountryModules,
  useGetPartners,
} from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useGetDefaultIndicators } from "@/lib/indicators";
import { useLocationGeometryWithStatus } from "@/lib/location";

import { useSyncLocation } from "@/app/(frontend)/store";

import { usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

export type CountryOption = {
  code: string | null;
  name: string;
  description: string;
  active: boolean;
  isDescriptionLoading: boolean;
  disabled: boolean;
  flagSrc?: string;
  href: { pathname: string; query: Record<string, string> };
};

// Only a resolved geometry against a resolved boundary can prove the area is empty there:
// anything unresolved reads as a ratio of 0 too.
function isAreaOutsideCountry(
  geometry: __esri.GeometryUnion | null,
  boundaries: CountryBoundary[] | undefined,
  slug: string,
): boolean {
  const boundary = boundaries?.find((entry) => entry.slug === slug);
  if (!geometry || !boundary) return false;

  return getCountryCoverageRatio(geometry, boundary.geometry) === 0;
}

export function useCountryOptions(): CountryOption[] | null {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const country = useCountry();
  const modules = useGetCountryModules();
  const partners = useGetPartners();
  const liveSlugs = useGetActiveModuleSlugs();
  const { data: indicators } = useGetDefaultIndicators({ locale, country: liveSlugs });

  const [location] = useSyncLocation();
  const { geometry, isCalculating } = useLocationGeometryWithStatus(location);

  const canCheckCoverage =
    country === null &&
    !isUnscopedPathname(pathname) &&
    !isSavedReportPathname(pathname) &&
    !!location;
  const { data: boundaries } = useGetLiveCountryBoundaries(modules, { enabled: canCheckCoverage });
  const settledGeometry = canCheckCoverage && !isCalculating ? geometry : null;

  const query = useMemo(() => Object.fromEntries(searchParams?.entries() ?? []), [searchParams]);

  return useMemo(() => {
    if (!isFeatureEnabled("country-module")) return null;
    if (pathname === "/") return null;
    if (isUnscopedPathname(pathname) || isSavedReportPathname(pathname)) return null;

    const amazonRegion: CountryOption = {
      code: null,
      name: t("country-module-amazon-region-name"),
      description: t("country-module-amazon-region-description"),
      active: country === null,
      isDescriptionLoading: false,
      disabled: false,
      href: { pathname, query },
    };

    const countries = modules.map(
      (module): CountryOption => ({
        code: module.slug,
        name: module.moduleName,
        description: indicators
          ? t("country-module-country-description", {
              count: indicators.filter((indicator) => indicator.module?.slug === module.slug)
                .length,
              partners: getModulePartners(partners, module.id).length,
            })
          : "",
        active: module.slug === country,
        isDescriptionLoading: !indicators,
        disabled: isAreaOutsideCountry(settledGeometry, boundaries, module.slug),
        flagSrc: countryFlagSrc(module.country),
        href: { pathname: withCountry(pathname, module.slug, liveSlugs), query },
      }),
    );

    return [amazonRegion, ...countries];
  }, [
    t,
    pathname,
    query,
    country,
    modules,
    partners,
    liveSlugs,
    indicators,
    settledGeometry,
    boundaries,
  ]);
}
