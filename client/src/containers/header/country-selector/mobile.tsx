"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { LocaleLink } from "@/i18n/navigation";

import { ComingSoonBadge } from "./coming-soon";
import { useCountryOptions } from "./options";

const MobileCountrySelector = ({ onSelected }: { onSelected: () => void }) => {
  const t = useTranslations();
  const options = useCountryOptions();

  if (!options) return null;

  return (
    <>
      <p className="text-muted-foreground px-6 pt-4 text-xs font-semibold tracking-wide uppercase">
        {t("country-module-selector-label")}
      </p>

      {options.map((option) =>
        option.href ? (
          <LocaleLink
            key={option.code ?? "amazon-region"}
            href={option.href}
            onClick={onSelected}
            aria-current={option.active ? "page" : undefined}
            className={cn({
              "px-6 py-4 text-lg text-blue-900 hover:bg-blue-200 hover:text-blue-500": true,
              "text-blue-500": option.active,
            })}
          >
            {option.name}
          </LocaleLink>
        ) : (
          <span
            key={option.code ?? "amazon-region"}
            aria-disabled
            className="flex items-center gap-2 px-6 py-4 text-lg text-blue-900 opacity-60"
          >
            <span>{option.name}</span>
            <ComingSoonBadge />
          </span>
        ),
      )}
    </>
  );
};

export default MobileCountrySelector;
