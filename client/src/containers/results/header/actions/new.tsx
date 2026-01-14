"use client";

import { useCallback, useState } from "react";

import { useParams } from "next/navigation";

import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { DropdownMenuItem } from "@/components/ui/dropdown";
import { Spinner } from "@/components/ui/spinner";

import { Link, useRouter } from "@/i18n/navigation";

export const NewReportAction = () => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const { id } = useParams();

  const CHANGED = useReportFormChanged();

  const CAN_EDIT = useCanEditReport(`${id}`);

  const router = useRouter();

  const callback = useCallback(() => {
    setOpen(false);
    // Create a link to download the report after saving
    router.push("/reports");
  }, [router]);

  const { mutation: saveMutation, handleSave } = useSaveReportCallback(callback);
  const { mutation: duplicateMutation, handleDuplicate } = useDuplicateReportCallback(callback);

  return (
    <>
      {CHANGED && (
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

      {!CHANGED && (
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
          className="max-w-xl"
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
