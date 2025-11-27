"use client";

import { useState } from "react";

import ReactMarkdown from "react-markdown";

import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { LuCircleAlert } from "react-icons/lu";

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

  const handleNewReport = () => {
    localStorage.removeItem("new:location");
    setOpen(false);
  };

  return (
    <>
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

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent
          area-describedby={t("report-results-buttons-new-report-description")}
          className="max-w-lg"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("report-results-buttons-new-report")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ReactMarkdown>{t("report-results-buttons-new-report-description")}</ReactMarkdown>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start space-x-4 rounded-sm border border-border bg-blue-50 p-3">
            <LuCircleAlert className="text-alert h-5 w-5 shrink-0" />
            <p className="text-sm font-medium text-foreground">{t("new-report-modal-warning")}</p>
          </div>

          <AlertDialogFooter className="flex w-full justify-end space-x-2 justify-self-end">
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

            <Link href="/report" onClick={handleNewReport}>
              <AlertDialogAction>
                {t("report-results-buttons-new-report-confirm")}
              </AlertDialogAction>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
