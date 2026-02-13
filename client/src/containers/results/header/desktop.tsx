"use client";

import { cn } from "@/lib/utils";

import { ActionsReport } from "@/containers/results/header/actions";
import EditReport from "@/containers/results/header/edit";
import EditLocationReport from "@/containers/results/header/edit-location";
import { LeaveReport } from "@/containers/results/header/leave";
import SaveReport from "@/containers/results/header/save";
import TitleReport from "@/containers/results/header/title";

export default function ReportResultsHeaderDesktop() {
  return (
    <header
      className={cn({
        "relative mb-6 bg-blue-50 pt-6 print:hidden": true,
        "after:absolute after:inset-0 after:top-full after:left-0 after:-z-10 after:h-6 after:w-full after:bg-gradient-to-b after:from-blue-50 after:to-blue-50/0": true,
      })}
    >
      <div className="container">
        <div className="relative flex h-full justify-between gap-10">
          <TitleReport />

          <div className="flex items-center space-x-2 print:hidden">
            <EditLocationReport />
            <EditReport />
            <SaveReport />
            <ActionsReport />
            <LeaveReport />
          </div>
        </div>
      </div>
    </header>
  );
}
