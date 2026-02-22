"use client";
import ReactMarkdown from "react-markdown";

import { LucidePlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { LuCircleAlert } from "react-icons/lu";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function NewReport() {
  const t = useTranslations();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild className="print:hidden">
        <Button variant="outline" className="space-x-2 border-none px-2.5 py-2 shadow-none">
          <LucidePlusCircle className="h-5 w-5" />
          <span>{t("report-results-buttons-new-report")}</span>
        </Button>
      </AlertDialogTrigger>
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
        <div className="border-border flex items-start space-x-4 rounded-xs border bg-blue-50 p-3">
          <LuCircleAlert className="text-alert h-5 w-5 shrink-0" />
          <p className="text-foreground text-sm font-medium">{t("new-report-modal-warning")}</p>
        </div>

        <AlertDialogFooter className="flex w-full justify-end space-x-2 justify-self-end">
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

          <Link href="/reports">
            <AlertDialogAction>{t("report-results-buttons-new-report-confirm")}</AlertDialogAction>
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
