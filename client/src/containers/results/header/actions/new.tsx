"use client";

import { useState } from "react";

import { useParams } from "next/navigation";

import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCanEditReport } from "@/lib/report";

import { useReportFormChanged } from "@/app/(frontend)/store";

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

import { Link } from "@/i18n/navigation";

export const NewReportAction = () => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const { id } = useParams();

  const CHANGED = useReportFormChanged();

  const CAN_EDIT = useCanEditReport(`${id}`);

  return (
    <>
      {CHANGED && CAN_EDIT && (
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className="cursor-pointer"
        >
          <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
          <span>{t("report-results-buttons-new-report")}</span>
        </DropdownMenuItem>
      )}

      {(!CHANGED || !CAN_EDIT) && (
        <Link href="/reports">
          <DropdownMenuItem className="cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
            <span>{t("report-results-buttons-new-report")}</span>
          </DropdownMenuItem>
        </Link>
      )}

      <AlertDialog key="new-report-dialog" open={open} onOpenChange={setOpen}>
        <AlertDialogContent
          area-describedby={t("report-results-unsaved-changes-description")}
          className="max-w-lg"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("report-results-unsaved-changes-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("report-results-unsaved-changes-description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex w-full space-x-2 sm:justify-between">
            <Link href="/reports">
              <AlertDialogCancel>{t("report-results-discard-and-continue")}</AlertDialogCancel>
            </Link>

            <div className="flex justify-end space-x-2">
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

              <AlertDialogAction>{t("save")}</AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
