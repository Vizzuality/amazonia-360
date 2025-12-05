"use client";

import { useLocale, useTranslations } from "next-intl";
import { LuDownload } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const DownloadAction = ({ report }: ReportActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <DropdownMenuItem asChild>
      <a
        href={`/${locale}/webshot/reports/${report.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center"
      >
        <LuDownload className="mr-2 h-4 w-4" />
        <span>{t("my-reports-action-download")}</span>
      </a>
    </DropdownMenuItem>
  );
};
