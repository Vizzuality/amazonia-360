"use client";

import { useCallback, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuDownload, LuFileText } from "react-icons/lu";

import { useCanEditReport } from "@/lib/report";

import { useReportFormChanged } from "@/app/(frontend)/store";

import { useDuplicateReportCallback, useSaveReportCallback } from "@/containers/results/callbacks";

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

import { useRouter } from "@/i18n/navigation";

import type { ReportResultsActionsProps } from "./types";

export const DownloadAction = ({ reportId }: ReportResultsActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  const router = useRouter();

  const [open, setOpen] = useState(false);

  const CHANGED = useReportFormChanged();
  const CAN_EDIT = useCanEditReport(`${reportId}`);

  const saveCallback = useCallback(() => {
    setOpen(false);
    // Create a link to download the report after saving
    const link = document.createElement("a");
    link.href = `/${locale}/webshot/reports/${reportId}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  }, [locale, reportId]);

  const duplicateCallback = useCallback(
    (newReportId: string) => {
      setOpen(false);
      // Create a link to download the report after saving
      const link = document.createElement("a");
      link.href = `/${locale}/webshot/reports/${newReportId}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();

      router.push(`/reports/${newReportId}`);
    },
    [locale, router],
  );

  const { mutation: saveMutation, handleSave } = useSaveReportCallback(saveCallback);
  const { mutation: duplicateMutation, handleDuplicate } =
    useDuplicateReportCallback(duplicateCallback);

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

          <AlertDialogContent
            aria-describedby={t("report-results-unsaved-changes-download-warning")}
            className="max-w-xl"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{t("report-results-unsaved-changes-title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {CAN_EDIT
                  ? t("report-results-unsaved-changes-download-warning")
                  : t("report-results-unsaved-changes-download-warning-duplicate")}
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

                {CAN_EDIT && (
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
                )}

                {!CAN_EDIT && (
                  <AlertDialogAction
                    disabled={duplicateMutation.isPending}
                    className="space-x-2"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDuplicate();
                    }}
                  >
                    {!duplicateMutation.isPending && <LuFileText className="h-5 w-5" />}
                    {duplicateMutation.isPending && <Spinner className="h-5 w-5" />}

                    <span>{t("make-a-copy")}</span>
                  </AlertDialogAction>
                )}
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
