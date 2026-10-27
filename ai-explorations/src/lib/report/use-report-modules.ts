"use client";

import { useTranslations } from "use-intl";

import { countryFlagSrc } from "@/lib/country";
import {
  type CountryModule,
  getCountryModuleBySlug,
  useGetCountryModules,
} from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getReportModuleSlugs } from "@/lib/report/modules";
import { useReportCountry } from "@/lib/report/use-report-country";

import type { Report } from "@/payload-types";

export type ReportModule = { code: string | null; name: string; flagSrc?: string };

export function getReportModulesFromSlugs(
  slugs: readonly string[],
  modules: readonly CountryModule[],
): ReportModule[] {
  return slugs.flatMap((slug) => {
    const countryModule = getCountryModuleBySlug(modules, slug);
    return countryModule
      ? [
          {
            code: countryModule.slug,
            name: countryModule.moduleName,
            flagSrc: countryFlagSrc(countryModule.country),
          },
        ]
      : [];
  });
}

export function useReportModules(): ReportModule[] | null {
  const t = useTranslations();
  const slugs = useReportCountry();
  const modules = useGetCountryModules();

  if (!isFeatureEnabled("country-module")) return null;

  const reportModules = getReportModulesFromSlugs(slugs ?? [], modules);

  if (reportModules.length === 0) {
    return [{ code: null, name: t("country-module-amazon-region-name") }];
  }
  return reportModules;
}

export function useReportModulesFromEntries(entries: Report["modules"]): ReportModule[] | null {
  const t = useTranslations();
  const modules = useGetCountryModules();
  if (!isFeatureEnabled("country-module")) return null;
  if (!entries || entries.length === 0) {
    return [{ code: null, name: t("country-module-amazon-region-name") }];
  }
  return getReportModulesFromSlugs(getReportModuleSlugs(entries, modules), modules);
}
