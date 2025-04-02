"use client";

import Link from "next/link";

import { useTranslations } from "next-intl";
import { LuPlus } from "react-icons/lu";

import { useLocationTitle } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import DownloadReport from "@/containers/results/header/download";
import ShareReport from "@/containers/results/header/share";

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

export default function ReportResultsHeaderMobile() {
  const t = useTranslations();
  const [location] = useSyncLocation();

  const title = useLocationTitle(location);

  return (
    <header className="space-y-4 bg-blue-50 py-6 print:hidden">
      <div className="container">
        <div className="relative flex h-full justify-between">
          {/* Name */}
          <div className="flex w-full flex-col">
            <h1 className="text-2xl font-bold text-primary lg:text-3xl tall:xl:text-4xl">
              {title}
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
                      {t("report-results-new-report-description")}
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
