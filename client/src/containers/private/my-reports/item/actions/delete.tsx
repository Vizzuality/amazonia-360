"use client";

import { LuTrash } from "react-icons/lu";
import { toast } from "sonner";

import { useDeleteReport } from "@/lib/report";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const DeleteAction = ({ report }: ReportActionsProps) => {
  const deleteMutation = useDeleteReport();

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync(report.id), {
      loading: "Deleting report...",
      success: "Report deleted successfully!",
      error: "Failed to delete the report.",
    });
  };

  return (
    <DropdownMenuItem
      onClick={handleDelete}
      className="cursor-pointer text-destructive focus:text-destructive"
    >
      <LuTrash className="mr-2 h-4 w-4" />
      <span>Delete</span>
    </DropdownMenuItem>
  );
};
