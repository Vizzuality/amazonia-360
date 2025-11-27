"use client";

import { useTranslations } from "next-intl";
import { LuDownload } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportResultsActionsProps } from "./types";

export const DownloadAction = ({ reportId }: ReportResultsActionsProps) => {
  const t = useTranslations();

  return (
    <DropdownMenuItem asChild>
      <a
        href={`/webshot/reports/${reportId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center"
      >
        <LuDownload className="mr-2 h-4 w-4 shrink-0" />
        <span>{t("download")}</span>
      </a>
    </DropdownMenuItem>
  );
};
