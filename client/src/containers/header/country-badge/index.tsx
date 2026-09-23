"use client";

import { useMemo } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Globe, X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  COUNTRIES,
  countryFlagSrc,
  isSavedReportPathname,
  isUnscopedPathname,
  stripCountry,
} from "@/lib/country";

import { Badge } from "@/components/ui/badge";

import { LocaleLink, usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

function getCountryName(code: string | null, t: ReturnType<typeof useTranslations>): string {
  if (code === null) return t("country-module-amazon-region-name");
  const entry = COUNTRIES.find((candidate) => candidate.code === code);
  return entry ? t(entry.nameKey) : code;
}

export default function CountryBadge({ onExit }: Readonly<{ onExit?: () => void }>) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const country = useCountry();

  const query = useMemo(() => Object.fromEntries(searchParams?.entries() ?? []), [searchParams]);

  if (isUnscopedPathname(pathname) || isSavedReportPathname(pathname)) return null;

  const name = getCountryName(country, t);

  return (
    <Badge
      variant="secondary"
      data-testid="country-badge"
      data-country={country ?? "REGIONAL"}
      className="w-fit gap-2 py-1 pr-1 pl-2 text-blue-900"
    >
      {country === null ? (
        <Globe className="h-5 w-5 shrink-0 text-blue-500" aria-hidden />
      ) : (
        <Image
          src={countryFlagSrc(country)}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      )}

      <span className="whitespace-nowrap">{name}</span>

      {country !== null && (
        <LocaleLink
          href={{ pathname: stripCountry(pathname), query }}
          onClick={onExit}
          data-testid="country-badge-exit"
          aria-label={t("country-module-exit")}
          className="focus:ring-ring rounded-xs p-1 text-blue-500 hover:text-blue-900 focus:ring-2 focus:outline-hidden"
        >
          <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </LocaleLink>
      )}
    </Badge>
  );
}
