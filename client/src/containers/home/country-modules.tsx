"use client";

import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";

import { countryFlagSrc } from "@/lib/country";
import {
  getModulePartners,
  useGetActiveModuleSlugs,
  useGetCountryModules,
  useGetPartners,
} from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { useGetDefaultIndicators } from "@/lib/indicators";

import { Skeleton } from "@/components/ui/skeleton";

import { LocaleLink } from "@/i18n/navigation";

export default function CountryModules() {
  const t = useTranslations();
  const locale = useLocale();
  const modules = useGetCountryModules();
  const partners = useGetPartners();
  const activeSlugs = useGetActiveModuleSlugs();
  const { data: indicators } = useGetDefaultIndicators({ locale, country: activeSlugs });

  if (!isFeatureEnabled("country-module")) return null;

  return (
    <section className="bg-blue-700" data-testid="home-country-modules">
      <div className="container flex flex-col gap-10 py-20 lg:flex-row lg:items-center lg:gap-[129px] lg:py-[120px]">
        <div className="flex flex-col gap-6 lg:flex-1 lg:pb-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm leading-none font-bold tracking-[0.7px] text-blue-200 uppercase">
                {t("landing-country-modules-note")}
              </h3>
              <h2 className="text-primary-foreground text-2xl font-semibold lg:text-[40px] lg:leading-[48px]">
                {t("landing-country-modules-title")}
              </h2>
            </div>
            <p className="text-primary-foreground text-base leading-6 font-medium">
              {t("landing-country-modules-description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex-1">
          {modules.map((module) => (
            <LocaleLink
              key={module.slug}
              href={{
                pathname: `/${module.slug}/reports`,
                query: module.bbox ? { bbox: module.bbox.join(",") } : undefined,
              }}
              data-testid={`home-country-module-${module.slug}`}
              className="group relative flex min-h-[159px] flex-col gap-12 rounded-md bg-white/5 p-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[2px]">
                <Image
                  src={countryFlagSrc(module.country)}
                  alt=""
                  width={33}
                  height={32}
                  className="h-8 w-[33px] rounded-[4px] object-cover"
                />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-primary-foreground text-base font-bold">
                  {module.moduleName}
                </span>
                {indicators ? (
                  <span className="text-muted text-xs font-medium">
                    {t("country-module-country-description", {
                      count: indicators.filter(
                        (indicator) => indicator.module?.slug === module.slug,
                      ).length,
                      partners: getModulePartners(partners, module.id).length,
                    })}
                  </span>
                ) : (
                  <Skeleton className="h-4 w-full max-w-40" aria-hidden />
                )}
              </span>
              <span className="absolute top-4 right-4 rounded-[2px] bg-blue-50/10 px-1 py-0.5 text-[10px] font-bold tracking-[0.6px] text-cyan-600 uppercase transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">
                {t("landing-country-modules-live")}
              </span>
              <span
                aria-hidden
                className="absolute top-[2px] right-[2px] flex items-center justify-center overflow-hidden rounded-bl-[4px] border-b border-l border-cyan-600 bg-white/10 p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <Image src="/images/home/arrow-top-right.svg" alt="" width={20} height={20} />
              </span>
            </LocaleLink>
          ))}

          <div className="border-accent-foreground flex min-h-[159px] flex-col justify-end rounded-md border p-4">
            <p className="text-primary-foreground text-base font-bold">
              {t("landing-country-modules-more")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
