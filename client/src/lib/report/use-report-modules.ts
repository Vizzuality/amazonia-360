"use client";

import { useTranslations } from "next-intl";

import { countryFlagSrc } from "@/lib/country";
import { getCountryModuleBySlug, useGetCountryModules } from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useReportCountry } from "@/lib/report/use-report-country";

export type ReportModule = { code: string | null; name: string; flagSrc?: string };

export function useReportModules(): ReportModule[] | null {
  const t = useTranslations();
  const slugs = useReportCountry();
  const modules = useGetCountryModules();

  if (!isFeatureEnabled("country-module")) return null;

  const entries = (slugs ?? []).flatMap((slug) => {
    const countryModule = getCountryModuleBySlug(modules, slug);
    return countryModule ? [countryModule] : [];
  });

  if (entries.length === 0) {
    return [{ code: null, name: t("country-module-amazon-region-name") }];
  }

  return entries.map((countryModule) => ({
    code: countryModule.slug,
    name: countryModule.moduleName,
    flagSrc: countryFlagSrc(countryModule.country),
  }));
}
