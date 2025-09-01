"use client";

import { useAtomValue } from "jotai";

import { reportPanelAtom, useSyncLocation } from "@/app/store";

import SidebarLocationContent from "@/containers/report/location/content";
import ReportMobileWarning from "@/containers/report/location/mobile-warning";
import SketchMobile from "@/containers/report/location/sketch/mobile";
import SidebarIndicatorsContent from "@/containers/report/location/tabs/topics";

export default function ReportLocationMobile() {
  const [location] = useSyncLocation();
  const reportPanel = useAtomValue(reportPanelAtom);

  return (
    <>
      <div className="container grid grid-cols-12">
        <div className="col-span-12">
          <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
            <div className="h-full w-full grow">
              {reportPanel === "location" && <SidebarLocationContent />}

              {reportPanel === "topics" && <SidebarIndicatorsContent />}
            </div>
          </aside>
        </div>
      </div>

      {reportPanel === "location" && !location && <SketchMobile />}

      <ReportMobileWarning />
    </>
  );
}
