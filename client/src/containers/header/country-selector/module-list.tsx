"use client";

import { MouseEvent, PointerEvent, useId, useRef, useState } from "react";

import Image from "next/image";

import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Check, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { getCountryAmazoniaBoundaryOptions } from "@/lib/country/coverage";
import { cn } from "@/lib/utils";

import { tmpBboxAtom } from "@/app/(frontend)/store";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

export type ModuleListVariant = "popover" | "inline";

function ModuleRowBody({
  option,
  subtitle,
}: Readonly<{ option: CountryOption; subtitle?: string }>) {
  const muted = option.disabled;

  return (
    <>
      <ModuleIcon option={option} />
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className={cn("text-foreground text-sm font-bold", muted && "text-muted-foreground")}>
          {option.name}
        </span>
        {option.isDescriptionLoading ? (
          <Skeleton className="h-4 w-40" aria-hidden />
        ) : (
          <span className="text-muted-foreground text-xs font-medium">
            {subtitle ?? option.description}
          </span>
        )}
      </span>
      {option.active && <Check className="size-5 shrink-0 text-cyan-500" aria-hidden />}
    </>
  );
}

type TooltipPointer = { x: number; y: number; rowHeight: number };

export function getTooltipPlacement(pointer: TooltipPointer | null) {
  if (!pointer) return { side: "right" as const };

  return {
    side: "bottom" as const,
    align: "start" as const,
    alignOffset: pointer.x + 12,
    sideOffset: pointer.y - pointer.rowHeight + 16,
  };
}

function DisabledModuleRow({
  option,
  variant,
}: Readonly<{ option: CountryOption; variant: ModuleListVariant }>) {
  const isInline = variant === "inline";
  const reasonId = useId();
  const [pointer, setPointer] = useState<TooltipPointer | null>(null);

  const isPointerInside = useRef(false);

  const handleFocus = () => {
    if (!isPointerInside.current) setPointer(null);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    isPointerInside.current = true;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      rowHeight: rect.height,
    });
  };

  const row = (
    <div
      role={isInline ? undefined : "link"}
      aria-disabled="true"
      aria-current={option.active ? "page" : undefined}
      aria-describedby={isInline ? undefined : reasonId}
      tabIndex={isInline ? undefined : 0}
      onPointerMove={isInline ? undefined : handlePointerMove}
      onPointerLeave={
        isInline
          ? undefined
          : () => {
              isPointerInside.current = false;
            }
      }
      onFocus={isInline ? undefined : handleFocus}
      data-disabled
      data-testid="country-selector-option"
      data-country={option.code ?? "REGIONAL"}
      className={cn(
        "flex h-14 cursor-not-allowed items-center gap-2 rounded-lg border border-transparent py-2 pr-4 pl-2",
        option.active && "border-border",
      )}
    >
      <ModuleRowBody option={option} subtitle={isInline ? option.disabledReason : undefined} />
      {!isInline && (
        <span id={reasonId} className="sr-only">
          {option.disabledReason}
        </span>
      )}
    </div>
  );

  if (isInline) return row;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent
        className="data-[state=closed]:zoom-out-100 max-w-64"
        {...getTooltipPlacement(pointer)}
      >
        {option.disabledReason}
      </TooltipContent>
    </Tooltip>
  );
}

function ModuleRow({
  option,
  variant,
  onClick,
}: Readonly<{
  option: CountryOption;
  variant: ModuleListVariant;
  onClick: (option: CountryOption, event: MouseEvent) => void;
}>) {
  if (option.disabled) return <DisabledModuleRow option={option} variant={variant} />;

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
  variant,
  className,
}: Readonly<{
  options: CountryOption[];
  onSelect: () => void;
  variant: ModuleListVariant;
  className?: string;
}>) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const regional = options.filter((option) => option.code === null);
  const countries = options.filter((option) => option.code !== null);

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
          <ModuleRow key="regional" option={option} variant={variant} onClick={handleClick} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold tracking-[0.55px] text-blue-400 uppercase">
          {t("country-module-selector-section-label")}
        </p>
        <div className="flex flex-col gap-0.5">
          {countries.map((option) => (
            <ModuleRow key={option.code} option={option} variant={variant} onClick={handleClick} />
          ))}
        </div>
      </div>
    </div>
  );
}
