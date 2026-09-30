"use client";

import Image from "next/image";

import { SquareArrowOutUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CountryCode } from "@/lib/country";
import { getCountryModulePartnerLogos, getRegionalPartnerLogos } from "@/lib/country/partners";

import { Button } from "@/components/ui/button";

export default function IndicatorsPartners({ country }: Readonly<{ country: CountryCode | null }>) {
  const t = useTranslations();
  const locale = useLocale();
  const logos = country ? getCountryModulePartnerLogos(country) : getRegionalPartnerLogos(locale);

  if (!logos.length) return null;

  return (
    <section data-testid="indicators-partners" className="mt-6 space-y-4 bg-blue-50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-xs font-bold tracking-[0.6px] uppercase">
          {t("country-module-modal-collaboration-title")}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          data-testid="indicators-partners-learn-more"
          className="text-foreground cursor-default gap-2 px-2 disabled:opacity-100"
        >
          {t("country-module-partnerships-cta")}
          <SquareArrowOutUpRight className="size-4" aria-hidden />
        </Button>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {logos.map((logo) => (
          <li
            key={logo.src}
            className="flex h-16 items-center justify-center rounded-lg bg-white px-3"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
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
