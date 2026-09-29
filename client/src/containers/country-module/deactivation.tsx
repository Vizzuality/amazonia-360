"use client";

import { useEffect, useRef } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { COUNTRIES, countryFlagSrc, stripCountry } from "@/lib/country";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import { useLocaleRouter, usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

import { countryModuleDeactivatedAtom } from "./store";
import { useCountryModuleCoverage } from "./use-coverage";

export default function CountryModuleDeactivation() {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useLocaleRouter();
  const country = useCountry();
  const { status, geometry } = useCountryModuleCoverage();
  const [deactivated, setDeactivated] = useAtom(countryModuleDeactivatedAtom);

  const queryString = searchParams?.toString() ?? "";
  const entry = COUNTRIES.find((candidate) => candidate.code === deactivated);
  const moduleName = entry ? t(entry.moduleNameKey) : "";
  const countryName = entry ? t(entry.nameKey) : "";

  const exitedGeometry = useRef<typeof geometry>(null);

  const handleClose = () => setDeactivated(null);

  useEffect(() => {
    if (country === null) {
      exitedGeometry.current = null;
      return;
    }

    if (status !== "outside" || exitedGeometry.current === geometry) return;

    // Keyed on the resolved geometry, not the location: the buffered geometry lags a new
    // location, so a location key would judge the previous area's geometry.
    exitedGeometry.current = geometry;
    setDeactivated(country);
    const query = Object.fromEntries(new URLSearchParams(queryString).entries());
    router.replace({ pathname: stripCountry(pathname), query });
  }, [status, geometry, country, pathname, queryString, router, setDeactivated]);

  if (!entry) return null;

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-md" overlay data-testid="country-module-deactivated-dialog">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src={countryFlagSrc(entry.code)}
              alt=""
              width={24}
              height={20}
              className="h-5 w-6 shrink-0 rounded-[2px] object-cover"
            />
            <DialogTitle className="text-lg">
              {t("country-module-deactivated-title", { name: moduleName })}
            </DialogTitle>
          </div>

          <DialogDescription className="text-muted-foreground mt-2 text-sm">
            {t("country-module-deactivated-body", { name: countryName })}
          </DialogDescription>

          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleClose}>
              {t("got-it-alert-button")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
