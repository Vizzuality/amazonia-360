"use client";

import { LuEye } from "react-icons/lu";
import { useLocale, useTranslations } from "use-intl";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const ViewAction = ({ report }: ReportActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <DropdownMenuItem asChild>
      <a href={`/${locale}/reports/${report.id}`} className="flex cursor-pointer items-center">
        <LuEye className="mr-2 h-4 w-4" />
        <span>{t("my-reports-action-view")}</span>
      </a>
    </DropdownMenuItem>
  );
};
