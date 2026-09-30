"use client";

import { MouseEvent, useId } from "react";

import Image from "next/image";

import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Check, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { getCountryAmazoniaBoundaryOptions } from "@/lib/country/coverage";
import { cn } from "@/lib/utils";

import { tmpBboxAtom } from "@/app/(frontend)/store";

import { Skeleton } from "@/components/ui/skeleton";

import { LocaleLink } from "@/i18n/navigation";

import { CountryOption } from "./options";

function ModuleIcon({ option }: Readonly<{ option: CountryOption }>) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-blue-50">
      {option.flagSrc ? (
        <Image
          src={option.flagSrc}
          alt=""
          width={33}
          height={32}
          className="h-8 w-[33px] rounded-[2px] object-cover"
        />
      ) : (
        <Globe className="size-5 text-blue-500" aria-hidden />
      )}
    </span>
  );
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function ModuleRowBody({ option }: Readonly<{ option: CountryOption }>) {
  return (
    <>
      <ModuleIcon option={option} />
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="text-foreground text-sm font-bold">{option.name}</span>
        {option.isDescriptionLoading ? (
          <Skeleton className="h-4 w-40" aria-hidden />
        ) : (
          <span className="text-muted-foreground text-xs font-medium">{option.description}</span>
        )}
      </span>
      {option.active && <Check className="size-5 shrink-0 text-cyan-500" aria-hidden />}
    </>
  );
}

function DisabledModuleRow({ option }: Readonly<{ option: CountryOption }>) {
  return (
    <div
      aria-disabled="true"
      data-disabled
      data-testid="country-selector-option"
      data-country={option.code ?? "REGIONAL"}
      className="flex h-14 cursor-not-allowed items-center gap-2 rounded-lg border border-transparent py-2 pr-4 pl-2 opacity-50"
    >
      <ModuleRowBody option={option} />
    </div>
  );
}

function ModuleRow({
  option,
  onClick,
}: Readonly<{
  option: CountryOption;
  onClick: (option: CountryOption, event: MouseEvent) => void;
}>) {
  if (option.disabled) return <DisabledModuleRow option={option} />;

  return (
    <LocaleLink
      href={option.href}
      onClick={(event) => onClick(option, event)}
      aria-current={option.active ? "page" : undefined}
      aria-busy={option.isDescriptionLoading}
      data-testid="country-selector-option"
      data-country={option.code ?? "REGIONAL"}
      className={cn(
        "flex h-14 items-center gap-2 rounded-lg border border-transparent py-2 pr-4 pl-2 hover:bg-blue-50",
        option.active && "border-border",
      )}
    >
      <ModuleRowBody option={option} />
    </LocaleLink>
  );
}

export default function ModuleList({
  options,
  onSelect,
  className,
}: Readonly<{
  options: CountryOption[];
  onSelect: () => void;
  className?: string;
}>) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const unavailableLabelId = useId();
  const unavailableDescriptionId = useId();

  const regional = options.filter((option) => option.code === null);
  const available = options.filter((option) => option.code !== null && !option.disabled);
  const unavailable = options.filter((option) => option.code !== null && option.disabled);

  const panToModule = (code: string) => {
    queryClient
      .fetchQuery(getCountryAmazoniaBoundaryOptions(code))
      .then((boundary) => {
        if (boundary?.extent) setTmpBbox(boundary.extent);
      })
      .catch(() => undefined);
  };

  const handleClick = (option: CountryOption, event: MouseEvent) => {
    if (isModifiedClick(event)) return;
    onSelect();
    if (option.code) panToModule(option.code);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        {regional.map((option) => (
          <ModuleRow key="regional" option={option} onClick={handleClick} />
        ))}
      </div>

      {available.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold tracking-[0.55px] text-blue-400 uppercase">
            {t("country-module-selector-section-label")}
          </p>
          <div className="flex flex-col gap-0.5">
            {available.map((option) => (
              <ModuleRow key={option.code} option={option} onClick={handleClick} />
            ))}
          </div>
        </div>
      )}

      {unavailable.length > 0 && (
        <fieldset
          aria-labelledby={unavailableLabelId}
          aria-describedby={unavailableDescriptionId}
          data-testid="country-selector-unavailable"
          className="flex flex-col gap-2"
        >
          <div className="flex flex-col gap-1">
            <p
              id={unavailableLabelId}
              className="text-[11px] font-bold tracking-[0.55px] text-blue-400 uppercase"
            >
              {t("country-module-selector-unavailable-label")}
            </p>
            <p id={unavailableDescriptionId} className="text-muted-foreground text-xs font-medium">
              {t("country-module-selector-unavailable-description", { count: unavailable.length })}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            {unavailable.map((option) => (
              <ModuleRow key={option.code} option={option} onClick={handleClick} />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
