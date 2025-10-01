"use client";

import { Separator } from "@radix-ui/react-select";

import DownloadReportButton from "@/containers/header/results/download";
import IndicatorsReport from "@/containers/header/results/indicators";
import NewReport from "@/containers/header/results/new";
import ShareReport from "@/containers/header/results/share";

export default function ReportResultsHeaderDesktop() {
  return (
    <header className="sticky right-0 top-0 z-10 space-y-4 py-6 print:hidden">
      <div className="relative flex h-full justify-between">
        <div className="mr-4 flex items-center space-x-6">
          <NewReport />
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
