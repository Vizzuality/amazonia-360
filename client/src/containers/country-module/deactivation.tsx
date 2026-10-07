"use client";

import { useEffect, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { stripCountry } from "@/lib/country";
import {
  getCountryModuleBySlug,
  useGetActiveModuleSlugs,
  useGetCountryModules,
} from "@/lib/country-modules";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const modules = useGetCountryModules();
  const liveSlugs = useGetActiveModuleSlugs();
  const { status, geometry } = useCountryModuleCoverage();
  const [deactivated, setDeactivated] = useAtom(countryModuleDeactivatedAtom);

  const queryString = searchParams?.toString() ?? "";
  const entry = getCountryModuleBySlug(modules, deactivated);
  const moduleName = entry?.moduleName ?? "";

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
    router.replace({ pathname: stripCountry(pathname, liveSlugs), query });
  }, [status, geometry, country, pathname, queryString, router, setDeactivated, liveSlugs]);

  if (!entry) return null;

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg gap-0 rounded-md"
        overlay
        data-testid="country-module-deactivated-dialog"
      >
        <DialogTitle className="pr-8 text-lg leading-6 font-bold">
          {t("country-module-deactivated-title", { name: moduleName })}
        </DialogTitle>

        <DialogDescription className="text-muted-foreground mt-2 text-sm leading-5 font-medium">
          {t("country-module-deactivated-body", { name: moduleName })}
        </DialogDescription>

        <div className="mt-6 flex justify-end">
          <Button type="button" className="h-9" onClick={handleClose}>
            {t("got-it-alert-button")}
          </Button>
        </div>

        <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-[15px] right-[15px] rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none" />
      </DialogContent>
    </Dialog>
  );
}
