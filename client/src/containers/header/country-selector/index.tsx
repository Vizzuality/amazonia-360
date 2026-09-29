"use client";

import { Suspense, useId, useState } from "react";

import Image from "next/image";

import { ChevronDown, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { isSavedReportPathname } from "@/lib/country";
import { isFeatureEnabled } from "@/lib/feature-flags";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { usePathname } from "@/i18n/navigation";

import LockedCountrySelector, { LockedCountrySelectorSkeleton } from "./locked";
import ModuleList from "./module-list";
import { CountryOption, useCountryOptions } from "./options";

function TriggerIcon({ option }: Readonly<{ option: CountryOption }>) {
  return (
    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-sm bg-blue-50">
      {option.flagSrc ? (
        <Image
          src={option.flagSrc}
          alt=""
          width={17}
          height={16}
          className="h-4 w-[17px] rounded-[2px] object-cover"
        />
      ) : (
        <Globe className="size-4 text-blue-500" aria-hidden />
      )}
    </span>
  );
}

export default function CountrySelector() {
  const t = useTranslations();
  const options = useCountryOptions();
  const titleId = useId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (isFeatureEnabled("country-module") && isSavedReportPathname(pathname)) {
    return (
      <Suspense fallback={<LockedCountrySelectorSkeleton />}>
        <LockedCountrySelector />
      </Suspense>
    );
  }

  if (!options) return null;

  const active = options.find((option) => option.active) ?? options[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="country-selector-trigger"
          data-country={active.code ?? "REGIONAL"}
          className="border-border text-foreground hover:bg-secondary flex h-10 cursor-pointer items-center gap-2 rounded-lg border py-2 pr-4 pl-2 text-sm font-bold"
        >
          <TriggerIcon option={active} />
          <span className="whitespace-nowrap">{active.name}</span>
          <ChevronDown className="size-5 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        aria-labelledby={titleId}
        className="border-border bg-background w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-0 shadow-md"
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="text-accent-foreground text-base font-extrabold">
              {t("country-module-selector-title")}
            </h2>
            <p className="text-muted-foreground text-sm leading-5 font-medium">
              {t("country-module-selector-description")}
            </p>
          </div>

          <ModuleList options={options} onSelect={() => setOpen(false)} />
        </div>

        <div className="border-border flex items-center justify-between gap-6 border-t bg-blue-50 p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-accent-foreground text-[13px] font-bold">
              {t("country-module-selector-footer-title")}
            </h3>
            <p className="text-muted-foreground text-sm leading-5 font-medium">
              {t("country-module-selector-footer-text")}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0" disabled>
            {t("country-module-partnerships-cta")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
