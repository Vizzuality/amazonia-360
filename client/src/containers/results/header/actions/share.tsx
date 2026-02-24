"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuCopy, LuFileText, LuShare2 } from "react-icons/lu";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown";
import { Spinner } from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";

import type { ReportResultsActionsProps } from "./types";

export const ShareAction = ({ reportId }: ReportResultsActionsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  const router = useRouter();

  const [alertOpen, setAlertOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLinkBtnText, setShareLinkBtnText] = useState<"copy" | "copied">("copy");

  const CHANGED = useReportFormChanged();
  const CAN_EDIT = useCanEditReport(`${reportId}`);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/${locale}/reports/${reportId}`;
    }
    return "";
  }, [reportId, locale]);

  const copyShareLink = useCallback(() => {
    if (!shareUrl) return;

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setShareLinkBtnText("copied");
        setTimeout(function () {
          setShareLinkBtnText("copy");
        }, 1000);
      })
      .catch((err: Error) => {
        console.error("Failed to copy:", err.message);
      });
  }, [shareUrl]);

  const saveCallback = useCallback(() => {
    setAlertOpen(false);
    setShareOpen(true);
  }, []);

  const duplicateCallback = useCallback(
    (newReportId: string) => {
      setAlertOpen(false);
      router.replace(`/reports/${newReportId}`);
    },
    [router],
  );

  const { mutation: saveMutation, handleSave } = useSaveReportCallback(saveCallback);
  const { mutation: duplicateMutation, handleDuplicate } =
    useDuplicateReportCallback(duplicateCallback);

  return (
    <>
      {!CHANGED && (
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            setShareOpen(true);
          }}
          className="cursor-pointer"
        >
          <LuShare2 className="mr-2 h-4 w-4 shrink-0" />
          <span>{t("share")}</span>
        </DropdownMenuItem>
      )}

      {CHANGED && (
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setAlertOpen(true);
            }}
            className="cursor-pointer"
          >
            <LuShare2 className="mr-2 h-4 w-4 shrink-0" />
            <span>{t("share")}</span>
          </DropdownMenuItem>

          <AlertDialogContent
            aria-describedby={t("report-results-unsaved-changes-share-warning")}
            className="max-w-xl"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{t("report-results-unsaved-changes-title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {CAN_EDIT
                  ? t("report-results-unsaved-changes-share-warning")
                  : t("report-results-unsaved-changes-share-warning-duplicate")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex w-full space-x-2 sm:justify-between">
              <AlertDialogCancel
                onClick={() => {
                  setAlertOpen(false);
                  setShareOpen(true);
                }}
              >
                {t("report-results-discard-and-continue")}
              </AlertDialogCancel>

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

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="w-full">
          <DialogTitle className="sr-only">{t("report-results-copy-title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("report-results-copy-description")}
          </DialogDescription>
          <div className="mb-6 flex max-w-fit flex-col space-y-2">
            <h3 className="text-lg font-bold text-foreground">{t("report-results-copy-title")}</h3>
            <p className="text-base font-medium text-muted-foreground">
              {t("report-results-copy-description")}
            </p>
          </div>
          <div className="mb-6 flex w-full space-x-2 overflow-hidden">
            <div className="flex h-10 w-[calc(100%_-_theme(space.32))] rounded-sm border bg-background px-3 py-2 text-sm text-gray-900">
              <p className="truncate text-base font-normal text-foreground">{shareUrl}</p>
            </div>
            <Button className="h-10 w-40 gap-2" onClick={copyShareLink}>
              <LuCopy className="h-4 w-4" />
              <span>{t(`${shareLinkBtnText}`)}</span>
            </Button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </>
  );
};
