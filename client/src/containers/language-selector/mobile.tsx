"use client";

import { useSearchParams } from "next/navigation";

import { useLocale } from "next-intl";

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
import { Locale } from "@/i18n/types";

const MobileLanguageSelector = () => {
  const locale = useLocale() as Locale;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()?.toString();

  const onSelectLocale = (nextLocale: string) => {
    const path = `${pathname}${searchParams ? `?${searchParams}` : ""}`;
    router.push(path, { locale: nextLocale });
  };
  return (
    <Select value={locale} onValueChange={onSelectLocale} open={true}>
      <SelectTrigger className="h-fit rounded-none border-none px-6 py-4 text-lg text-blue-900 outline-none hover:bg-blue-200 hover:text-blue-500 focus:ring-0">
        <SelectValue>{localeLabelsShort[locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent className="no-scrollbar z-[100] -translate-x-2.5 overflow-y-auto rounded-none border-none shadow-sm">
        {LOCALES.map((l) => (
          <SelectItem
            key={l}
            value={l}
            disabled={l === locale}
            className={cn({
              "text-lg hover:text-cyan-500": true,
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

export default MobileLanguageSelector;
