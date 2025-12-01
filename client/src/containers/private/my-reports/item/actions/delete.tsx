"use client";

import { useState } from "react";

import { LuTrash } from "react-icons/lu";
import { toast } from "sonner";

import { useDeleteReport } from "@/lib/report";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const DeleteAction = ({ report }: ReportActionsProps) => {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteReport();

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync(report.id), {
      loading: "Deleting report...",
      success: "Report deleted successfully!",
      error: "Failed to delete the report.",
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer text-destructive focus:text-destructive"
      >
        <LuTrash className="mr-2 h-4 w-4" />
        <span>Delete</span>
      </DropdownMenuItem>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your report.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
