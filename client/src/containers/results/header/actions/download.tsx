"use client";

import { useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuDownload } from "react-icons/lu";

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

import type { ReportResultsActionsProps } from "./types";

export const DownloadAction = ({ reportId }: ReportResultsActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  const [open, setOpen] = useState(false);

  const CHANGED = useReportFormChanged();

  return (
    <>
      {!CHANGED && (
        <DropdownMenuItem>
          <a
            href={`/${locale}/webshot/reports/${reportId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center"
          >
            <LuDownload className="mr-2 h-4 w-4 shrink-0" />
            <span>{t("download")}</span>
          </a>
        </DropdownMenuItem>
      )}

      {CHANGED && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            <LuDownload className="mr-2 h-4 w-4 shrink-0" />
            <span>{t("download")}</span>
          </DropdownMenuItem>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("report-results-unsaved-changes-title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("report-results-unsaved-changes-download-warning")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex w-full space-x-2 sm:justify-between">
              <a
                href={`/${locale}/webshot/reports/${reportId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center"
              >
                <AlertDialogCancel>{t("report-results-discard-and-continue")}</AlertDialogCancel>
              </a>

              <div className="flex justify-end space-x-2">
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                <AlertDialogAction>{t("save")}</AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
