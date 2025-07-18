"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { LuPlus } from "react-icons/lu";

import { useLocationTitle } from "@/lib/location";

import { useSyncLocation, useSyncTopics } from "@/app/store";

import Topics from "@/containers/report/topics";
import DownloadReport from "@/containers/results/header/download";
import IndicatorsReport from "@/containers/results/header/indicators";
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
import { useSidebar } from "@/components/ui/sidebar";

import { Link } from "@/i18n/navigation";

export default function ReportResultsHeaderDesktop() {
  const t = useTranslations();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();

  const title = useLocationTitle(location);

  const [open] = useState(false);

  const { open: isSidebarOpen } = useSidebar();
  const searchParams = useSearchParams();
  return (
    <header className="sticky right-0 top-0 z-10 space-y-4 bg-blue-50 py-6 print:hidden">
      <div className="container">
        <div className="relative flex h-full justify-between">
          {/* Name */}
          <div className="mr-4 flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-primary lg:text-3xl tall:xl:text-4xl">
              {title}
            </h1>

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
                <AlertDialogFooter className="flex w-full justify-end space-x-2 justify-self-end">
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>

                  <Link href="/report">
                    <AlertDialogAction>{t("continue")}</AlertDialogAction>
                  </Link>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {!isSidebarOpen && (
            <div className="flex items-center space-x-2 print:hidden">
              <DownloadReport />
              <Link
                href={{
                  pathname: "/report-pdf",
                  query: {
                    ...Object.fromEntries(searchParams.entries()),
                    topics: JSON.stringify(topics).replace(/'/g, '"'),
                  },
                }}
                aria-disabled={!topics || topics.length === 0}
                className={!topics || topics.length === 0 ? "pointer-events-none" : ""}
              >
                <Button
                  variant="outline"
                  className="space-x-2"
                  disabled={!topics || topics.length === 0}
                >
                  <span>PDF test</span>
                </Button>
              </Link>
              <ShareReport />
              <IndicatorsReport />
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="duration-300 animate-in fade-in zoom-in-95">
          <Topics size="sm" interactive />
        </div>
      )}
    </header>
  );
}
