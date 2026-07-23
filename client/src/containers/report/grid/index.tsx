"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportGridDesktop from "@/containers/report/grid/desktop";
// import ReportGridMobile from "@/containers/report/grid/mobile";

export default function ReportGrid() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <div className="pointer-events-none z-10 w-full lg:absolute lg:top-10 lg:bottom-8 lg:left-0">
          <div className="container grid grid-cols-12">
            <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
              <ReportGridDesktop />
            </div>
          </div>
        </div>
      </Media>

      {/* <Media lessThan="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportGridMobile />
      </Media> */}
    </Suspense>
  );
}
