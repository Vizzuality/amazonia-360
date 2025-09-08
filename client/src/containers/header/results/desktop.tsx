"use client";

import ReactMarkdown from "react-markdown";

import { Separator } from "@radix-ui/react-select";
import { LucidePlusCircle, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import DownloadReportButton from "@/containers/header/results/download";
import IndicatorsReport from "@/containers/header/results/indicators";
import ShareReport from "@/containers/header/results/share";

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

export default function ReportResultsHeaderDesktop() {
  const t = useTranslations();

  return (
    <header className="sticky right-0 top-0 z-10 space-y-4 py-6 print:hidden">
      <div className="relative flex h-full justify-between">
        <div className="mr-4 flex items-center space-x-6">
          <AlertDialog>
            <AlertDialogTrigger asChild className="print:hidden">
              <Button variant="outline" className="space-x-2 border-none px-2.5 py-2 shadow-none">
                <LucidePlusCircle className="h-5 w-5" />
                <span>{t("report-results-buttons-new-report")}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              area-describedby="report-results-buttons-new-report-description"
              className="max-w-lg"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{t("report-results-buttons-new-report")}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <ReactMarkdown>
                    {t("report-results-buttons-new-report-description")}
                  </ReactMarkdown>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex items-start space-x-4 rounded-sm border border-border bg-blue-50 p-3">
                <CircleAlert className="text-alert h-5 w-5 shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  {t("new-report-modal-warning")}
                </p>
              </div>

              <AlertDialogFooter className="flex w-full justify-end space-x-2 justify-self-end">
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                <Link href="/report">
                  <AlertDialogAction>
                    {t("report-results-buttons-new-report-confirm")}
                  </AlertDialogAction>
                </Link>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center space-x-2 print:hidden">
          <Separator className="mr-2 h-4 w-px bg-border" />
          <ShareReport />
          <DownloadReportButton />
          <IndicatorsReport />
        </div>
      </div>
    </header>
  );
}
