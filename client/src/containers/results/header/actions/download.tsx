"use client";

import { useCallback, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuDownload, LuFileText } from "react-icons/lu";

import { useReportFormChanged } from "@/app/(frontend)/store";

import { useSaveReportCallback } from "@/containers/results/callbacks";

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
import { Spinner } from "@/components/ui/spinner";

import type { ReportResultsActionsProps } from "./types";

export const DownloadAction = ({ reportId }: ReportResultsActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  const [open, setOpen] = useState(false);

  const CHANGED = useReportFormChanged();

  const callback = useCallback(() => {
    setOpen(false);
    // Create a link to download the report after saving
    const link = document.createElement("a");
    link.href = `/${locale}/webshot/reports/${reportId}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }, [locale, reportId]);

  const { mutation: saveMutation, handleSave } = useSaveReportCallback(callback);

  return (
    <>
      {!CHANGED && (
        <DropdownMenuItem>
          <a
            href={`/${locale}/webshot/reports/${reportId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center space-x-2"
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

                <AlertDialogAction
                  disabled={saveMutation.isPending}
                  className="space-x-2"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                >
                  {!saveMutation.isPending && <LuFileText className="h-5 w-5" />}
                  {saveMutation.isPending && <Spinner className="h-5 w-5" />}

                  <span>{t("save")}</span>
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
