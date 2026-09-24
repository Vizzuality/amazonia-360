"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { COUNTRIES, countryFlagSrc, getCountryCodes } from "@/lib/country";
import { useReportCountry } from "@/lib/report/use-report-country";

export default function ModuleReport() {
  const t = useTranslations();
  const codes = getCountryCodes(useReportCountry());

  const entries = COUNTRIES.filter((entry) => codes.includes(entry.code));

  if (entries.length === 0) return null;

  return (
    <>
      {entries.map((entry) => (
        <span
          key={entry.code}
          className="border-border text-muted-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
        >
          <Image
            src={countryFlagSrc(entry.code)}
            alt=""
            width={14}
            height={14}
            className="shrink-0 rounded-full object-cover"
          />
          {t(entry.nameKey)}
        </span>
      ))}
    </>
  );
}
