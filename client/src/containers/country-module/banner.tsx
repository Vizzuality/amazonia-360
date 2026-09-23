"use client";

import { useTranslations } from "next-intl";

import { COUNTRIES, isUnscopedPathname } from "@/lib/country";
import {
  getCountryCoveragePercent,
  getCountryCoverageRatio,
  useGetCountryAmazoniaBoundary,
} from "@/lib/country-coverage";
import { useLocationGeometry } from "@/lib/location";
import useIsMounted from "@/lib/mounted";

import { useSyncLocation } from "@/app/(frontend)/store";

import { usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

export default function CountryModuleBanner() {
  const t = useTranslations();
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const country = useCountry();
  const [location] = useSyncLocation();
  const geometry = useLocationGeometry(location);

  const enabled = country !== null && !isUnscopedPathname(pathname);
  const { data: boundary } = useGetCountryAmazoniaBoundary(country ?? "", { enabled });

  const entry = COUNTRIES.find((candidate) => candidate.code === country);
  const inside = getCountryCoveragePercent(getCountryCoverageRatio(geometry, boundary ?? null));

  // An unresolved boundary makes the ratio 0, which reads as "none of your area is covered" —
  // the opposite of the truth — so wait for it rather than warn on a placeholder.
  if (!isMounted() || !enabled || !entry || !geometry || !boundary || inside >= 100) return null;

  return (
    <div className="border-border border-b bg-blue-50 print:hidden">
      <div className="container flex h-12 items-center md:mx-auto">
        <p className="text-secondary-foreground text-sm font-medium">
          {t("country-module-coverage-banner", {
            percent: 100 - inside,
            name: t(entry.nameKey),
          })}
        </p>
      </div>
    </div>
  );
}
