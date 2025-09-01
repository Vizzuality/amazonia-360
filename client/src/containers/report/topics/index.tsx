"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportTopicsDesktop from "@/containers/report/topics/desktop";
// import ReportGridMobile from "@/containers/report/grid/mobile";

export default function ReportTopics() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportTopicsDesktop />
      </Media>

      {/* <Media lessThan="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportGridMobile />
      </Media> */}
    </Suspense>
  );
}
