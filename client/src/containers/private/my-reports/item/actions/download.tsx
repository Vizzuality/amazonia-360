"use client";

import { LuDownload } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const DownloadAction = ({ report }: ReportActionsProps) => {
  return (
    <DropdownMenuItem asChild>
      <a
        href={`/webshot/reports/${report.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center"
      >
        <LuDownload className="mr-2 h-4 w-4" />
        <span>Download</span>
      </a>
    </DropdownMenuItem>
  );
};
