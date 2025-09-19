"use client";

import { useAtomValue } from "jotai";

import { reportPanelAtom, sketchAtom, useSyncLocation } from "@/app/store";

import SidebarIndicatorsContent from "@/containers/report/generate";
import SidebarLocationContent from "@/containers/report/location/content-mobile";
import ReportMobileWarning from "@/containers/report/location/mobile-warning";

export default function ReportLocationMobile() {
  const [location] = useSyncLocation();
  const reportPanel = useAtomValue(reportPanelAtom);
  const sketch = useAtomValue(sketchAtom);

  return (
    <>
      <div className="container grid h-full grow grid-cols-12">
        <div className="col-span-12 h-full">
          <aside className="pointer-events-auto flex h-full w-full shrink-0 grow flex-col overflow-hidden">
            <div className="h-full w-full grow">
              {reportPanel === "location" && !sketch.enabled && !location && (
                <SidebarLocationContent />
              )}

              {reportPanel === "topics" && <SidebarIndicatorsContent heading="select" />}
            </div>
          </aside>
        </div>
      </div>

      <ReportMobileWarning />
    </>
  );
}
