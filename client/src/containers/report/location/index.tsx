"use client";

import { Suspense } from "react";

import { useAtom } from "jotai";

import { cn } from "@/lib/utils";

import { reportPanelAtom, useSyncLocation } from "@/app/(frontend)/store";

import { Media } from "@/containers/media";
import ReportLocationDesktop from "@/containers/report/location/desktop";
import ReportLocationMobile from "@/containers/report/location/mobile";

import Confirm from "./confirm";
import SketchMobile from "./sketch/mobile";

export default function ReportLocation() {
  const [location] = useSyncLocation();
  const [reportPanel, setReportPanel] = useAtom(reportPanelAtom);

  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportLocationDesktop />
      </Media>

      <Media lessThan="lg">
        <div
          className={cn({
            "flex h-full w-full flex-col": true,
            relative: reportPanel === "location",
            "absolute top-0 bottom-0 left-0 z-10 w-screen bg-white": reportPanel === "topics",
          })}
        >
          <ReportLocationMobile />
        </div>

        {reportPanel === "location" && !location && <SketchMobile />}
        {location && reportPanel === "location" && (
          <div className="absolute bottom-0 z-10 w-full bg-white">
            <div className="container grid grid-cols-12">
              <div className="col-span-12 py-6">
                <Confirm onConfirm={() => setReportPanel("topics")} />
              </div>
            </div>
          </div>
        )}
      </Media>
    </Suspense>
  );
}
