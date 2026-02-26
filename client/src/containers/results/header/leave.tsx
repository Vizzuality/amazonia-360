"use client";

import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { useNavigationGuard } from "next-navigation-guard";
import { LuFileText } from "react-icons/lu";

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
import { Spinner } from "@/components/ui/spinner";

export const LeaveReport = () => {
  const t = useTranslations();

  const { id } = useParams();

  const CHANGED = useReportFormChanged();

  const CAN_EDIT = useCanEditReport(`${id}`);

  const navGuard = useNavigationGuard({
    enabled: ({ type }) => type !== "replace" && CHANGED,
  });

  const callback = useCallback(() => {
    navGuard.accept();
  }, [navGuard]);

  const { mutation: saveMutation, handleSave } = useSaveReportCallback(callback);
  const { mutation: duplicateMutation, handleDuplicate } = useDuplicateReportCallback(callback);

  return (
    <>
      <AlertDialog key="new-report-dialog" open={navGuard.active}>
        <AlertDialogContent
          aria-describedby={t("report-results-unsaved-changes-description")}
          className="max-w-xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("report-results-unsaved-changes-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("report-results-unsaved-changes-description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex w-full space-x-2 sm:justify-between">
            <AlertDialogCancel
              onClick={() => {
                navGuard.accept();
              }}
            >
              {t("report-results-discard-and-continue")}
            </AlertDialogCancel>

            <div className="flex justify-end space-x-2">
              <AlertDialogCancel onClick={navGuard.reject}>{t("cancel")}</AlertDialogCancel>

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
    </>
  );
};
