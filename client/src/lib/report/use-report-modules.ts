"use client";

import { useTranslations } from "next-intl";

import { COUNTRIES, CountryCode, countryFlagSrc, getCountryCodes } from "@/lib/country";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useReportCountry } from "@/lib/report/use-report-country";

export type ReportModule = { code: CountryCode | null; name: string; flagSrc?: string };

export function useReportModules(): ReportModule[] | null {
  const t = useTranslations();
  const codes = getCountryCodes(useReportCountry());

  if (!isFeatureEnabled("country-module")) return null;

  const entries = COUNTRIES.filter((entry) => codes.includes(entry.code));

  if (entries.length === 0) {
    return [{ code: null, name: t("country-module-amazon-region-name") }];
  }

  return entries.map((entry) => ({
    code: entry.code,
    name: t(entry.moduleNameKey),
    flagSrc: countryFlagSrc(entry.code),
  }));
}
