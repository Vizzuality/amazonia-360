"use client";

import { LuTextCursorInput } from "react-icons/lu";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const RenameAction = ({ report }: ReportActionsProps) => {
  const handleRename = () => {
    // TODO: Implement rename logic
    console.log("Rename report:", report.id);
  };

  return (
    <DropdownMenuItem onClick={handleRename}>
      <LuTextCursorInput className="mr-2 h-4 w-4" />
      <span>Rename</span>
    </DropdownMenuItem>
  );
};
