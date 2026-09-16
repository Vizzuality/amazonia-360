"use client";

import { useId, useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";

import { COUNTRIES } from "@/constants/countries";

import { Toggle } from "@/components/ui/toggle";

type CountriesFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
};

type TranslateFn = ReturnType<typeof useTranslations>;
type MessageKey = Parameters<TranslateFn>[0];

function getSortedCountries(t: TranslateFn, locale: string) {
  const collator = new Intl.Collator(locale);
  return COUNTRIES.map(({ iso3 }) => ({
    iso3,
    // Cast: the key is built from a runtime iso3, so it can't be a message-key literal.
    label: t(`country-module-${iso3}-name` as MessageKey),
  })).sort((a, b) => collator.compare(a.label, b.label));
}

function getCountriesWith(value: string[], iso3: string): string[] {
  return [...value, iso3];
}

function getCountriesWithout(value: string[], iso3: string): string[] {
  return value.filter((code) => code !== iso3);
}

const CHIP_CLASSNAME =
  "h-8 min-w-0 gap-2 rounded-md border border-border bg-transparent px-2 text-sm font-semibold text-foreground hover:bg-accent hover:text-foreground data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-[hsl(var(--hover-primary))] data-[state=on]:hover:text-primary-foreground";

export function CountriesField({ value, onChange }: CountriesFieldProps) {
  const t = useTranslations();
  const locale = useLocale();
  const labelId = useId();
  const descriptionId = useId();

  const countries = useMemo(() => getSortedCountries(t, locale), [t, locale]);

  const handleToggleCountry = (iso3: string, pressed: boolean) => {
    onChange(pressed ? getCountriesWith(value, iso3) : getCountriesWithout(value, iso3));
  };

  return (
    <div className="flex flex-col gap-3 pb-2">
      <p id={labelId} className="text-foreground text-sm leading-5 font-medium">
        {t("auth-countries-label")}{" "}
        <span className="text-muted-foreground font-medium italic">
          {t("auth-countries-optional")}
        </span>
      </p>
      <p id={descriptionId} className="text-muted-foreground text-xs leading-4 font-normal">
        {t("auth-countries-description")}
      </p>
      <fieldset
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className="flex min-w-0 flex-wrap gap-2"
      >
        {countries.map(({ iso3, label }) => (
          <Toggle
            key={iso3}
            className={CHIP_CLASSNAME}
            pressed={value.includes(iso3)}
            onPressedChange={(pressed) => handleToggleCountry(iso3, pressed)}
          >
            {label}
          </Toggle>
        ))}
      </fieldset>
    </div>
  );
}
