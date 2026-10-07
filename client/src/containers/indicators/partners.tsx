"use client";

import Image from "next/image";

import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { getPartnersHref } from "@/lib/country/partners";
import {
  getCountryModuleBySlug,
  getModulePartners,
  getRegionalPartners,
  useGetCountryModules,
  useGetPartners,
} from "@/lib/country-modules";

import { Button } from "@/components/ui/button";

import { LocaleLink } from "@/i18n/navigation";

export default function IndicatorsPartners({ country }: Readonly<{ country: string | null }>) {
  const t = useTranslations();
  const countryModule = getCountryModuleBySlug(useGetCountryModules(), country);
  const partners = useGetPartners();
  const logos = countryModule
    ? getModulePartners(partners, countryModule.id)
    : getRegionalPartners(partners);

  if (!logos.length) return null;

  return (
    <section data-testid="indicators-partners" className="mt-6 space-y-4 bg-blue-50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-xs font-bold tracking-[0.6px] uppercase">
          {t("country-module-modal-collaboration-title")}
        </h3>
        <Button asChild variant="ghost" size="sm" className="text-foreground gap-2 px-2">
          <LocaleLink
            href={getPartnersHref(countryModule?.slug ?? null)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="indicators-partners-learn-more"
          >
            {t("country-module-partnerships-cta")}
            <SquareArrowOutUpRight className="size-4" aria-hidden />
          </LocaleLink>
        </Button>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {logos.map((partner) => (
          <li
            key={partner.id}
            className="flex h-16 items-center justify-center rounded-lg bg-white px-3"
          >
            <Image
              src={partner.logo}
              alt={partner.name}
              width={200}
              height={80}
              className="h-10 w-auto max-w-full object-contain"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
