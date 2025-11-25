"use client";

import { Separator } from "@radix-ui/react-select";

import { ReportResultsActions } from "@/containers/header/results/actions";
import IndicatorsReport from "@/containers/header/results/indicators";
import SaveReport from "@/containers/header/results/save";

export default function ReportResultsHeaderDesktop() {
  return (
    <header className="sticky right-0 top-0 z-10 space-y-4 py-6 print:hidden">
      <div className="relative flex h-full justify-between">
        <div className="mr-4 flex items-center space-x-6" />

        <div className="flex items-center space-x-2 print:hidden">
          <Separator className="mr-2 h-4 w-px bg-border" />
          <IndicatorsReport />
          <SaveReport />
          <ReportResultsActions />
        </div>
      </div>
    </header>
  );
}
