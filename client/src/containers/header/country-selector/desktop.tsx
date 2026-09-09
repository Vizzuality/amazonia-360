"use client";

import { useState } from "react";

import Image from "next/image";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Link } from "@/i18n/navigation";

import { ComingSoonBadge } from "./coming-soon";
import { ModuleSwitchHandler, moduleSwitchHandler } from "./module-switch";
import { CountryOption, useCountryOptions } from "./options";

function CountryIcon({ option, size }: { option: CountryOption; size: number }) {
  if (!option.flagSrc) {
    return <Globe className="shrink-0 text-blue-500" style={{ width: size, height: size }} />;
  }

  return (
    <Image
      src={option.flagSrc}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function CountryRow({
  option,
  onSelect,
}: {
  option: CountryOption;
  onSelect: ModuleSwitchHandler;
}) {
  const body = (
    <>
      <CountryIcon option={option} size={24} />
      <span className="flex flex-col text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          {option.name}
          {option.active && <Check className="h-4 w-4 text-cyan-500" aria-hidden />}
        </span>
        <span className="text-muted-foreground text-xs font-medium">{option.description}</span>
      </span>
    </>
  );

  if (!option.href) {
    return (
      <div aria-disabled className="flex items-start gap-3 rounded-xs px-3 py-2.5 opacity-60">
        {body}
        <ComingSoonBadge className="ml-auto" />
      </div>
    );
  }

  return (
    <Link
      href={option.href}
      onClick={onSelect}
      aria-current={option.active ? "page" : undefined}
      className={cn({
        "flex items-start gap-3 rounded-xs px-3 py-2.5 hover:bg-blue-50": true,
        "bg-blue-50": option.active,
      })}
    >
      {body}
    </Link>
  );
}

function Partnerships() {
  const t = useTranslations();

  return (
    <div className="mt-2 border-t border-blue-50 px-3 pt-4">
      <h4 className="text-sm font-semibold text-blue-900">
        {t("country-module-partnerships-title")}
      </h4>
      <p className="text-muted-foreground mt-1 text-xs font-medium">
        {t("country-module-partnerships-description")}
      </p>
      {/* Disabled rather than an anchor: the country-scoped partners page does not exist
          yet, and an empty href jumps to the top of the page while announcing itself a
          link. Greying it out says "not yet" instead of looking broken when clicked. */}
      <Button type="button" variant="outline" size="sm" className="mt-3" disabled>
        {t("country-module-partnerships-cta")}
      </Button>
    </div>
  );
}

export default function CountrySelector() {
  const t = useTranslations();
  const options = useCountryOptions();
  // Controlled because choosing a module does not navigate: nothing else would take the
  // popover down, and it would sit open over the module you just chose.
  const [open, setOpen] = useState(false);
  const onSelect = moduleSwitchHandler(() => setOpen(false));

  if (!options) return null;

  const active = options.find((option) => option.active) ?? options[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="hover:bg-secondary flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-sm font-semibold text-blue-900"
        >
          <span className="sr-only">{t("country-module-selector-label")}</span>
          <CountryIcon option={active} size={20} />
          <span className="whitespace-nowrap">{active.name}</span>
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-96 border-none bg-white p-2 shadow-md">
        <p className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">
          {t("country-module-selector-label")}
        </p>
        <nav className="flex flex-col">
          {options.map((option) => (
            <CountryRow key={option.segment} option={option} onSelect={onSelect} />
          ))}
        </nav>
        <Partnerships />
      </PopoverContent>
    </Popover>
  );
}
