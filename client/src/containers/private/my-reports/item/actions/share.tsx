"use client";

import { LuShare2 } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const ShareAction = ({ report }: ReportActionsProps) => {
  const handleShare = () => {
    // TODO: Implement share logic
    console.log("Share report:", report.id);
  };

  return (
    <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
      <LuShare2 className="mr-2 h-4 w-4" />
      <span>Share</span>
    </DropdownMenuItem>
  );
};
