"use client";

import { useTranslations } from "next-intl";
import { LuEye } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const ViewAction = ({ report }: ReportActionsProps) => {
  const t = useTranslations();

  return (
    <DropdownMenuItem asChild>
      <a
        href={`/reports/${report.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center"
      >
        <LuEye className="mr-2 h-4 w-4" />
        <span>{t("my-reports-action-view")}</span>
      </a>
    </DropdownMenuItem>
  );
};
