"use client";

import { useLocale, useTranslations } from "next-intl";

import { COUNTRIES, type CountryCode } from "@/constants/countries";

import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";

type CountriesFieldProps = {
  value: CountryCode[];
  onChange: (next: CountryCode[]) => void;
};

type TranslateFn = ReturnType<typeof useTranslations>;

function getSortedCountries(t: TranslateFn, locale: string) {
  const collator = new Intl.Collator(locale);
  return COUNTRIES.map(({ iso3, nameKey }) => ({
    iso3,
    label: t(nameKey),
  })).sort((a, b) => collator.compare(a.label, b.label));
}

const CHIP_CLASSNAME =
  "h-8 min-w-0 gap-2 rounded-md border border-border bg-transparent px-2 text-sm font-semibold text-foreground hover:bg-accent hover:text-foreground data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-[hsl(var(--hover-primary))] data-[state=on]:hover:text-primary-foreground";

export function CountriesField({ value, onChange }: Readonly<CountriesFieldProps>) {
  const t = useTranslations();
  const locale = useLocale();

  const countries = getSortedCountries(t, locale);

  const handleToggleCountry = (iso3: CountryCode, pressed: boolean) => {
    onChange(pressed ? [...value, iso3] : value.filter((code) => code !== iso3));
  };

  return (
    <FieldSet className="gap-3 pb-2">
      <FieldLegend variant="label">
        {t("auth-countries-label")}{" "}
        <span className="text-muted-foreground font-medium italic">
          {t("auth-countries-optional")}
        </span>
      </FieldLegend>
      <FieldDescription className="mt-0! text-xs leading-4">
        {t("auth-countries-description")}
      </FieldDescription>
      <div className="flex min-w-0 flex-wrap gap-2">
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
      </div>
    </FieldSet>
  );
}
