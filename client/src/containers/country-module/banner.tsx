"use client";

import { useEffect, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { COUNTRIES, isSavedReportPathname, isUnscopedPathname, stripCountry } from "@/lib/country";
import { getCountryCoveragePercent } from "@/lib/country/coverage";
import useIsMounted from "@/lib/mounted";

import { LocaleLink, usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

import { useCountryModuleCoverage } from "./use-coverage";

const STRIP_HEIGHT_VAR = "--country-module-strip-h";

export function getInsidePercent(ratio: number): number {
  if (ratio >= 1) return 100;
  return Math.min(Math.max(getCountryCoveragePercent(ratio), 1), 99);
}

export default function CountryModuleBanner() {
  const t = useTranslations();
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const country = useCountry();
  const { status, ratio } = useCountryModuleCoverage();

  const entry = COUNTRIES.find((candidate) => candidate.code === country);

  const isVisible =
    isMounted() && !!entry && !isUnscopedPathname(pathname) && !isSavedReportPathname(pathname);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!isVisible || !strip) return;

    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty(STRIP_HEIGHT_VAR, `${strip.offsetHeight}px`);
    });
    root.style.setProperty(STRIP_HEIGHT_VAR, `${strip.offsetHeight}px`);
    observer.observe(strip);

    return () => {
      observer.disconnect();
      root.style.removeProperty(STRIP_HEIGHT_VAR);
    };
  }, [isVisible]);

  if (!isVisible || !entry) return null;

  const moduleName = t(entry.moduleNameKey);
  const query = Object.fromEntries(searchParams?.entries() ?? []);

  return (
    <div
      ref={stripRef}
      data-testid="country-module-banner"
      className="border-border relative border-b bg-blue-50 lg:absolute lg:inset-x-0 lg:top-16 lg:z-20 print:hidden"
    >
      <div className="container flex min-h-[31px] items-start justify-between gap-2 md:mx-auto">
        <p className="text-foreground min-w-0 py-[7.5px] text-xs leading-4">
          <span className="font-bold">
            {t("country-module-active-label", { name: moduleName })}
          </span>{" "}
          {status === "no-area" && (
            <span className="text-muted-foreground font-semibold">
              {t("country-module-active-description")}
            </span>
          )}
          {status === "inside" && (
            <span
              data-testid="country-module-coverage"
              className="text-muted-foreground font-semibold"
            >
              {t("country-module-coverage-inside", {
                percent: getInsidePercent(ratio),
                name: moduleName,
              })}
            </span>
          )}
        </p>
        <LocaleLink
          href={{ pathname: stripCountry(pathname), query }}
          data-testid="country-module-exit"
          className="text-foreground mt-[3.5px] flex h-6 shrink-0 items-center gap-2.5 rounded px-2 text-xs leading-4 font-semibold whitespace-nowrap"
        >
          <X className="size-4" aria-hidden />
          {t("country-module-exit")}
        </LocaleLink>
      </div>
    </div>
  );
}
