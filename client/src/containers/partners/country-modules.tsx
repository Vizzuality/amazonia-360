"use client";

import Image from "next/image";

import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { COUNTRIES, type CountryCode } from "@/lib/country";
import { getCountryModulePartnerLogos, getPartnerCountryCodes } from "@/lib/country/partners";
import { isFeatureEnabled } from "@/lib/feature-flags";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PARTNER_COUNTRY_CODES = getPartnerCountryCodes();

const countryParser = parseAsStringLiteral(PARTNER_COUNTRY_CODES)
  .withDefault(PARTNER_COUNTRY_CODES[0])
  .withOptions({ history: "replace", clearOnDefault: false });

const DESCRIPTION_KEYS = {
  ECU: "partners-country-module-ECU-description",
} as const;

function getDescriptionKey(code: CountryCode) {
  return code in DESCRIPTION_KEYS ? DESCRIPTION_KEYS[code as keyof typeof DESCRIPTION_KEYS] : null;
}

const PARTNER_COUNTRIES = COUNTRIES.filter((entry) => PARTNER_COUNTRY_CODES.includes(entry.code));

function CountryPartners({ code }: Readonly<{ code: CountryCode }>) {
  const t = useTranslations();
  const descriptionKey = getDescriptionKey(code);

  return (
    <div className="flex flex-col items-center gap-14">
      {descriptionKey && (
        <p className="text-foreground max-w-[846px] text-center text-lg leading-8 font-medium whitespace-pre-line">
          {t(descriptionKey)}
        </p>
      )}
      <ul className="grid w-full grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {getCountryModulePartnerLogos(code).map((partner) => (
          <li
            key={partner.src}
            data-testid="partners-country-card"
            className="border-border flex flex-col items-center gap-1 rounded-[20px] border bg-white p-6 lg:h-[162px]"
          >
            <div className="relative aspect-[52/20] w-full">
              <Image
                src={partner.src}
                alt={partner.alt}
                fill
                sizes="192px"
                className="object-contain"
              />
            </div>
            <span className="text-foreground text-center text-sm leading-[normal] font-semibold">
              {partner.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CountryModulePartnerships() {
  const t = useTranslations();
  const [country, setCountry] = useQueryState("country", countryParser);

  if (!isFeatureEnabled("country-module")) return null;

  return (
    <section data-testid="partners-country-modules" className="bg-blue-50 py-24">
      <div className="container flex flex-col items-center gap-14">
        <header className="flex max-w-[800px] flex-col items-center gap-4 text-center">
          <h1 className="text-foreground text-[36px] leading-11 font-bold">
            {t("partners-country-modules-title")}
          </h1>
          <p className="text-muted-foreground text-base leading-5 font-medium">
            {t("partners-country-modules-description")}
          </p>
        </header>

        <Tabs
          value={country}
          onValueChange={(value) => setCountry(value as CountryCode)}
          className="flex w-full flex-col items-center gap-14"
        >
          <TabsList className="bg-muted inline-flex space-x-0 rounded-md border border-blue-100 p-[3px]">
            {PARTNER_COUNTRIES.map((entry) => (
              <TabsTrigger
                key={entry.code}
                value={entry.code}
                variant="primary"
                data-testid={`partners-country-tab-${entry.code}`}
                className="w-[196px] rounded-sm px-3 py-1.5 text-sm leading-5 font-semibold text-blue-500 data-[state=active]:text-white data-[state=active]:shadow-xs"
              >
                {t(entry.moduleNameKey)}
              </TabsTrigger>
            ))}
          </TabsList>

          {PARTNER_COUNTRIES.map((entry) => (
            <TabsContent key={entry.code} value={entry.code} className="w-full">
              <CountryPartners code={entry.code} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
