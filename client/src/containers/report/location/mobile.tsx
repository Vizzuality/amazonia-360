"use client";

import { Suspense } from "react";

import { useAtomValue } from "jotai";

import { reportPanelAtom } from "@/app/store";

import SketchMobile from "@/containers/report/location/sketch/mobile";
import TabsLocation from "@/containers/report/location/tabs/location";
import TabsTopics from "@/containers/report/location/tabs/topics";
import MapContainer from "@/containers/report/map";

export default function ReportLocationMobile() {
  const reportPanel = useAtomValue(reportPanelAtom);

  return (
    <>
      <div className="container grid grid-cols-12">
        <div className="col-span-12">
          <Suspense fallback={null}>
            <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
              <div className="h-full w-full grow">
                {reportPanel === "location" && <TabsLocation />}

                {reportPanel === "topics" && <TabsTopics />}
              </div>
            </aside>
          </Suspense>
        </div>
      </div>

      {reportPanel === "location" && (
        <Suspense fallback={null}>
          <MapContainer desktop={false} />
        </Suspense>
      )}

      {reportPanel === "location" && <SketchMobile />}
    </>
  );
}
