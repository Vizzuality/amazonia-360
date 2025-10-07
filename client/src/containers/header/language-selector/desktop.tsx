"use client";

import { useSearchParams } from "next/navigation";

import { Locale, useLocale } from "next-intl";

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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()?.toString();

  const onSelectLocale = (nextLocale: Locale) => {
    const path = `${pathname}${searchParams ? `?${searchParams}` : ""}`;
    router.push(path, { locale: nextLocale });
  };
  return (
    <Select value={locale} onValueChange={onSelectLocale}>
      <SelectTrigger className="w-fit rounded-sm border-none shadow-none outline-none hover:bg-secondary focus:ring-0">
        <SelectValue className="flex text-sm">{localeLabelsShort[locale]}</SelectValue>
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
