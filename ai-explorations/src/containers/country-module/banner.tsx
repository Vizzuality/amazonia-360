"use client";

import { useEffect, useRef } from "react";

import { X } from "lucide-react";
import { useTranslations } from "use-intl";

import { isSavedReportPathname, isUnscopedPathname, stripCountry } from "@/lib/country";
import { getCountryCoveragePercent } from "@/lib/country/coverage";
import { useGetActiveModuleSlugs, useGetCountryModule } from "@/lib/country-modules";
import useIsMounted from "@/lib/mounted";
import { useSearchParams } from "@/lib/navigation";

import { LocaleLink, usePathname } from "@/i18n/navigation";

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
  const entry = useGetCountryModule();
  const liveSlugs = useGetActiveModuleSlugs();
  const { status, ratio } = useCountryModuleCoverage();

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

  const { moduleName } = entry;
  const query = Object.fromEntries(searchParams?.entries() ?? []);

  return (
    <div
      ref={stripRef}
      data-testid="country-module-banner"
      className="relative border-b border-border bg-blue-50 lg:absolute lg:inset-x-0 lg:top-16 lg:z-20 print:hidden"
    >
      <div className="container flex min-h-[31px] items-start justify-between gap-2 md:mx-auto">
        <p className="min-w-0 py-[7.5px] text-xs leading-4 text-foreground">
          <span className="font-bold">
            {t("country-module-active-label", { name: moduleName })}
          </span>{" "}
          {status === "no-area" && (
            <span className="font-semibold text-muted-foreground">
              {t("country-module-active-description")}
            </span>
          )}
          {status === "inside" && (
            <span
              data-testid="country-module-coverage"
              className="font-semibold text-muted-foreground"
            >
              {t("country-module-coverage-inside", {
                percent: getInsidePercent(ratio),
                name: moduleName,
              })}
            </span>
          )}
        </p>
        <LocaleLink
          href={{ pathname: stripCountry(pathname, liveSlugs), query }}
          data-testid="country-module-exit"
          className="mt-[3.5px] flex h-6 shrink-0 items-center gap-2.5 rounded px-2 text-xs leading-4 font-semibold whitespace-nowrap text-foreground"
        >
          <X className="size-4" aria-hidden />
          {t("country-module-exit")}
        </LocaleLink>
      </div>
    </div>
  );
}
