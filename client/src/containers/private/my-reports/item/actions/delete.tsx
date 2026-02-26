"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteReport();

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync(report.id), {
      loading: t("my-reports-delete-toast-loading"),
      success: t("my-reports-delete-toast-success"),
      error: t("my-reports-delete-toast-error"),
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
        className="text-destructive focus:text-destructive cursor-pointer"
      >
        <LuTrash className="mr-2 h-4 w-4" />
        <span>{t("my-reports-action-delete")}</span>
      </DropdownMenuItem>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("my-reports-delete-dialog-title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("my-reports-delete-dialog-description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
