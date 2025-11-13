"use client";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { LuPlus } from "react-icons/lu";

import { useReport } from "@/lib/report";

import DownloadReport from "@/containers/header/results/download";
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

export default function ReportResultsHeaderMobile() {
  const t = useTranslations();

  const { id } = useParams();
  const { data: reportData } = useReport({ id: Number(id) });

  return (
    <header className="space-y-4 bg-blue-50 py-6 print:hidden">
      <div className="container">
        <div className="relative flex h-full justify-between">
          {/* Name */}
          <div className="flex w-full flex-col">
            <h1 className="text-2xl font-medium text-foreground lg:text-3xl tall:xl:text-4xl">
              {reportData?.title ?? t("selected-area")}
            </h1>

            <div className="flex w-full items-center justify-between space-x-2 py-2 print:hidden">
              <AlertDialog>
                <AlertDialogTrigger asChild className="print:hidden">
                  <Button variant="outline" className="space-x-2">
                    <LuPlus className="h-5 w-5" />
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
                  <AlertDialogFooter className="flex flex-row items-baseline justify-center space-x-2">
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                    <Link href="/report">
                      <AlertDialogAction>{t("continue")}</AlertDialogAction>
                    </Link>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex space-x-2">
                <DownloadReport />
                <ShareReport />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
