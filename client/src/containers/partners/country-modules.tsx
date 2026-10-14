"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";

import {
  getModulePartners,
  useGetCountryModules,
  useGetPartners,
  type CountryModule,
} from "@/lib/country-modules";
import { isFeatureEnabled } from "@/lib/feature-flags";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const countryParser = parseAsString.withOptions({ history: "replace" });

function CountryPartners({ module }: Readonly<{ module: CountryModule }>) {
  const partners = getModulePartners(useGetPartners(), module.id);

  return (
    <div className="flex flex-col items-center gap-14">
      {module.partnersDescription && (
        <p className="text-foreground max-w-[846px] text-center text-lg leading-8 font-medium whitespace-pre-line">
          {module.partnersDescription}
        </p>
      )}
      <ul className="mx-auto grid w-full max-w-[1232px] auto-rows-fr grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {partners.map((partner) => (
          <li
            key={partner.id}
            data-testid="partners-country-card"
            className="border-border flex flex-col items-center gap-1 rounded-[20px] border bg-white p-6 lg:h-[162px]"
          >
            <div className="relative aspect-[52/20] w-full">
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                sizes="192px"
                className="object-contain"
              />
            </div>
            {partner.label && (
              <span className="text-foreground text-center text-sm leading-[normal] font-semibold">
                {partner.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CountryModulePartnerships() {
  const t = useTranslations();
  const modules = useGetCountryModules();
  const partners = useGetPartners();
  const tabs = modules.filter((entry) => getModulePartners(partners, entry.id).length > 0);
  const [country, setCountry] = useQueryState("country", countryParser);
  const activeSlug = tabs.find((entry) => entry.slug === country)?.slug ?? tabs[0]?.slug;

  if (!isFeatureEnabled("country-module") || tabs.length === 0) return null;

  return (
    <section data-testid="partners-country-modules" className="bg-blue-50 py-24">
      <div className="container flex flex-col items-center gap-14">
        <header className="flex max-w-[800px] flex-col items-center gap-4 text-center">
          <h2 className="text-foreground text-[36px] leading-11 font-bold">
            {t("partners-country-modules-title")}
          </h2>
          <p className="text-muted-foreground text-base leading-5 font-medium">
            {t("partners-country-modules-description")}
          </p>
        </header>

        <Tabs
          value={activeSlug}
          onValueChange={setCountry}
          className="flex w-full flex-col items-center gap-14"
        >
          <TabsList className="max-w-full space-x-0 rounded-md border border-blue-100 p-[3px]">
            {tabs.map((entry) => (
              <TabsTrigger
                key={entry.slug}
                value={entry.slug}
                variant="primary"
                data-testid={`partners-country-tab-${entry.slug}`}
                className="w-[196px] max-w-full shrink rounded-sm px-3 py-1.5 text-sm leading-5 font-semibold text-blue-500 data-[state=active]:text-white data-[state=active]:shadow-xs"
              >
                {entry.moduleName}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((entry) => (
            <TabsContent key={entry.slug} value={entry.slug} className="w-full">
              <CountryPartners module={entry} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
