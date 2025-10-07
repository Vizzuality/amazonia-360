"use client";

import { useSearchParams } from "next/navigation";

import { useLocale } from "next-intl";

import { LOCALES, localeLabelsLong } from "@/lib/locales";
import { cn } from "@/lib/utils";

import { Link, usePathname } from "@/i18n/navigation";

const MobileLanguageSelector = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      {LOCALES.map((l) => (
        <Link
          key={l}
          locale={l}
          href={{
            pathname,
            query: {
              ...Object.fromEntries(searchParams.entries()),
            },
          }}
          className={cn({
            "px-6 py-4 text-lg text-blue-900 hover:bg-blue-200 hover:text-blue-500": true,
            "text-blue-500": l === locale,
          })}
        >
          {localeLabelsLong[l]}
        </Link>
      ))}
    </>
  );
};

export default MobileLanguageSelector;
