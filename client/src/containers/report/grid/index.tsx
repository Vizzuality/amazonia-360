"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportGridDesktop from "@/containers/report/grid/desktop";
// import ReportGridMobile from "@/containers/report/grid/mobile";

export default function ReportGrid() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportGridDesktop />
      </Media>

      {/* <Media lessThan="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportGridMobile />
      </Media> */}
    </Suspense>
  );
}
