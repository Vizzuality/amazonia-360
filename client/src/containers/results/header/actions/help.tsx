"use client";

import { LucideHelpCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportResultsActionsProps } from "./types";

const HELP_LINKS = {
  en: "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/?locale=en-us",
  es: "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/",
  pt: "https://rise.articulate.com/share/DzHpFspTQWmMCeeoMXA2_6v5Zljl-b7i#/?locale=pt-br",
};

export const HelpAction = (_props: ReportResultsActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <DropdownMenuItem asChild>
      <a
        href={HELP_LINKS[locale]}
        target="_blank"
        rel="noreferrer noopener"
        className="flex cursor-pointer items-center"
      >
        <LucideHelpCircle className="mr-2 h-4 w-4 shrink-0" />
        <span>{t("help")}</span>
      </a>
    </DropdownMenuItem>
  );
};
