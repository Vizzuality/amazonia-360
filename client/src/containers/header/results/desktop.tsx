"use client";

import { Separator } from "@radix-ui/react-select";
import { LucidePlusCircle } from "lucide-react";
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
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("report-results-buttons-new-report")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("report-results-buttons-new-report-description")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex w-full justify-end space-x-2 justify-self-end">
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                <Link href="/report">
                  <AlertDialogAction>{t("continue")}</AlertDialogAction>
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
