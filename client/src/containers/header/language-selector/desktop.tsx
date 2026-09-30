"use client";

import { useSearchParams } from "next/navigation";

import { Globe } from "lucide-react";
import { Locale, useLocale, useTranslations } from "next-intl";

import { LOCALES, localeLabelsShort, localeLabelsLong } from "@/lib/locales";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRouter, usePathname } from "@/i18n/navigation";

const LanguageSelector = () => {
  const locale = useLocale();
  const t = useTranslations();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()?.toString();

  const onSelectLocale = (nextLocale: Locale) => {
    const path = `${pathname}${searchParams ? `?${searchParams}` : ""}`;
    router.push(path, { locale: nextLocale });
  };
  return (
    <Select value={locale} onValueChange={onSelectLocale}>
      <SelectTrigger
        aria-label={t("language-selector-label")}
        hasArrow={false}
        className="hover:bg-secondary h-8 w-fit justify-start gap-2 space-x-0 rounded-md border-none px-2 py-0 text-xs leading-4 font-semibold shadow-none outline-hidden focus:ring-0"
      >
        <Globe aria-hidden className="size-4 shrink-0" />
        <SelectValue className="flex">{localeLabelsShort[locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
        {LOCALES.map((l) => (
          <SelectItem
            key={l}
            value={l}
            disabled={l === locale}
            className={cn({
              "text-sm hover:text-cyan-500": true,
              "cursor-pointer": l !== locale,
            })}
          >
            {localeLabelsLong[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
