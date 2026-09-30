"use client";

import Image from "next/image";

import { Globe, Lock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { useReportModules } from "@/lib/report/use-report-modules";

import { Skeleton } from "@/components/ui/skeleton";

export function LockedCountrySelectorSkeleton() {
  return <Skeleton className="h-10 w-48 rounded-lg" aria-hidden />;
}

export default function LockedCountrySelector() {
  const t = useTranslations();
  const format = useFormatter();
  const modules = useReportModules();

  if (!modules) return null;

  const [first] = modules;

  return (
    <div
      data-testid="country-selector-locked"
      data-country={first.code ?? "REGIONAL"}
      className="bg-muted text-foreground flex h-10 items-center gap-2 rounded-lg py-2 pr-4 pl-2 text-sm leading-none font-bold"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-blue-50 p-px">
        {first.flagSrc ? (
          <Image
            src={first.flagSrc}
            alt=""
            width={22}
            height={21}
            className="h-[21px] w-[22px] rounded-[2px] object-cover"
          />
        ) : (
          <Globe className="size-4 text-blue-500" aria-hidden />
        )}
      </span>
      <span className="whitespace-nowrap">{format.list(modules.map((module) => module.name))}</span>
      <Lock className="size-4 shrink-0" aria-hidden />
      <span className="sr-only">{t("country-module-selector-locked")}</span>
    </div>
  );
}
