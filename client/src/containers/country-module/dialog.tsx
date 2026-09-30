"use client";

import { useMemo, useState } from "react";

import useCookie from "react-use-cookie";

import Image from "next/image";

import { useLocale, useTranslations } from "next-intl";

import {
  COUNTRIES,
  CountryCode,
  countryFlagSrc,
  isSavedReportPathname,
  isUnscopedPathname,
} from "@/lib/country";
import { getCountryModulePartnerLogos, getPartnersHref } from "@/lib/country/partners";
import { useGetDefaultIndicators } from "@/lib/indicators";
import useIsMounted from "@/lib/mounted";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { LocaleLink, usePathname } from "@/i18n/navigation";
import { useCountry } from "@/i18n/use-country";

import { CountryModuleCoverageStatus, useCountryModuleCoverage } from "./use-coverage";

function getCountryModuleDialogCookieName(code: string): string {
  return `country-module-dialog-${code}`;
}

function getBodyMessageKey(
  status: CountryModuleCoverageStatus,
): "country-module-modal-body" | "country-module-modal-body-no-area" {
  return status === "no-area" ? "country-module-modal-body-no-area" : "country-module-modal-body";
}

function LayerCount({ count }: Readonly<{ count: number | undefined }>) {
  if (count === undefined) return <Skeleton className="h-8 w-10" aria-hidden />;

  return <p className="text-2xl leading-8 font-bold">{count}</p>;
}

// `useCookie` reads `document.cookie` in a lazy `useState` initializer and never resyncs when
// its key changes, so the module has to be a mount boundary or a dismissal would read the
// wrong country's cookie for the rest of the tab.
export default function CountryModuleDialog() {
  const country = useCountry();

  return <CountryModuleDialogContent key={country ?? "none"} country={country} />;
}

function CountryModuleDialogContent({ country }: Readonly<{ country: CountryCode | null }>) {
  const t = useTranslations();
  const locale = useLocale();
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const { data: indicators } = useGetDefaultIndicators({ locale });
  const { status: coverageStatus } = useCountryModuleCoverage();

  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [dismissedCookie, setDismissedCookie] = useCookie(
    getCountryModuleDialogCookieName(country ?? "none"),
    undefined,
  );

  const activeModule = country ? COUNTRIES.find((entry) => entry.code === country) : undefined;
  const moduleName = activeModule ? t(activeModule.nameKey) : "";

  const partnerLogos = getCountryModulePartnerLogos(country);

  const regionalLayersCount = useMemo(
    () => indicators?.filter((indicator) => !indicator.country).length,
    [indicators],
  );
  const nationalLayersCount = useMemo(
    () => indicators?.filter((indicator) => indicator.country === country).length,
    [indicators, country],
  );

  const handleGotIt = () => {
    if (dontShowAgain) setDismissedCookie("true");
    setDismissed(true);
  };

  if (!activeModule) return null;

  const isScoped = isMounted() && !isUnscopedPathname(pathname) && !isSavedReportPathname(pathname);
  const isCoverageKnownInside = coverageStatus === "no-area" || coverageStatus === "inside";
  const isOpen = isScoped && isCoverageKnownInside && dismissedCookie !== "true" && !dismissed;

  return (
    <>
      <Dialog
        open={isOpen}
        // Closing without ticking the box only hides this render — it re-opens on the next
        // arrival, since nothing is persisted unless the checkbox was checked.
        onOpenChange={(open) => {
          if (!open) setDismissed(true);
        }}
      >
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0" overlay>
          <div className="relative flex flex-col gap-6 bg-blue-700 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-blue-50">
                <Image
                  src={countryFlagSrc(activeModule.code)}
                  alt=""
                  width={40}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <DialogTitle className="text-primary-foreground text-2xl leading-8 font-bold">
                {moduleName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base leading-6 font-medium text-blue-50">
              {t(getBodyMessageKey(coverageStatus), { name: moduleName })}
            </DialogDescription>
            <DialogClose className="text-primary-foreground focus:ring-ring absolute top-4 right-4 rounded-xs opacity-80 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none" />
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div className="flex gap-2">
              <div
                className="bg-muted flex flex-1 flex-col gap-1 rounded-md px-4 py-4"
                aria-busy={regionalLayersCount === undefined}
              >
                <LayerCount count={regionalLayersCount} />
                <p className="text-sm leading-5 font-medium">
                  {t("country-module-modal-regional-layers")}
                </p>
              </div>
              <div
                className="bg-muted flex flex-1 flex-col gap-1 rounded-md px-4 py-4"
                aria-busy={nationalLayersCount === undefined}
              >
                <LayerCount count={nationalLayersCount} />
                <p className="text-sm leading-5 font-medium">
                  {t("country-module-modal-national-layers")}
                </p>
              </div>
            </div>

            {partnerLogos.length > 0 && (
              <>
                <h3 className="text-xs font-bold tracking-[0.6px] text-blue-700 uppercase">
                  {t("country-module-modal-collaboration-title")}
                </h3>

                <ul className="grid h-28 grid-cols-3 grid-rows-2 gap-2">
                  {partnerLogos.map((logo) => (
                    <li
                      key={logo.src}
                      className="relative overflow-hidden rounded-lg bg-white px-3 py-2"
                    >
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        fill
                        sizes="139px"
                        className="object-contain p-2"
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="country-module-dialog-dont-show-again"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                />
                <label
                  htmlFor="country-module-dialog-dont-show-again"
                  className="text-foreground text-sm leading-5 font-medium"
                >
                  {t("country-module-modal-dont-show-again")}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <LocaleLink
                    href={getPartnersHref(country)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("country-module-partnerships-cta")}
                  </LocaleLink>
                </Button>
                <Button type="button" size="sm" onClick={handleGotIt}>
                  {t("got-it-alert-button")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
