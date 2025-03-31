"use client";

import { useAtomValue } from "jotai";

import { reportPanelAtom, useSyncLocation } from "@/app/store";

import SketchMobile from "@/containers/report/location/sketch/mobile";
import TabsLocation from "@/containers/report/location/tabs/location";
import TabsTopics from "@/containers/report/location/tabs/topics";
import MapContainer from "@/containers/report/map";

export default function ReportLocationMobile() {
  const [location] = useSyncLocation();
  const reportPanel = useAtomValue(reportPanelAtom);

  return (
    <>
      <div className="container grid grid-cols-12">
        <div className="col-span-12">
          <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
            <div className="h-full w-full grow">
              {reportPanel === "location" && <TabsLocation />}

              {reportPanel === "topics" && <TabsTopics />}
            </div>
          </aside>
        </div>
      </div>

      {reportPanel === "location" && <MapContainer desktop={false} />}

      {reportPanel === "location" && !location && <SketchMobile />}
    </>
  );
}
