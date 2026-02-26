"use client";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";

import { useReport } from "@/lib/report";

import DownloadReport from "@/containers/results/header/download";
import NewReport from "@/containers/results/header/new";
import ShareReport from "@/containers/results/header/share";

export default function ReportResultsHeaderMobile() {
  const t = useTranslations();
  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });

  return (
    <header className="space-y-4 bg-blue-50 py-6 print:hidden">
      <div className="container">
        <div className="relative flex h-full justify-between">
          {/* Name */}
          <div className="flex w-full flex-col">
            <h1 className="text-foreground tall:xl:text-4xl text-2xl font-medium lg:text-3xl">
              {reportData?.title ?? t("selected-area")}
            </h1>

            <div className="flex w-full items-center justify-between space-x-2 py-2 print:hidden">
              <NewReport />

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
