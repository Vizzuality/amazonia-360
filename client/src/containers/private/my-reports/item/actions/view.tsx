"use client";

import { LuEye } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const ViewAction = ({ report }: ReportActionsProps) => {
  return (
    <DropdownMenuItem asChild>
      <a
        href={`/report/${report.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center"
      >
        <LuEye className="mr-2 h-4 w-4" />
        <span>View report</span>
      </a>
    </DropdownMenuItem>
  );
};
