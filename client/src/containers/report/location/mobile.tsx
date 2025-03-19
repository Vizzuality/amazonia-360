"use client";

import { useAtomValue } from "jotai";

import { reportPanelAtom } from "@/app/store";

import TabsLocation from "@/containers/report/location/tabs/location";
import TabsTopics from "@/containers/report/location/tabs/topics";

export default function ReportLocationMobile() {
  const reportPanel = useAtomValue(reportPanelAtom);

  return (
    <div className="h-full w-full grow">
      {reportPanel === "location" && <TabsLocation />}

      {reportPanel === "topics" && <TabsTopics />}
    </div>
  );
}
