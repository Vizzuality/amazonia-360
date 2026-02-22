"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportIndicatorsDesktop from "@/containers/report/indicators/desktop";
import ReportIndicatorsMobile from "@/containers/report/indicators/mobile";

export default function ReportIndicators() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <div className="pointer-events-none z-10 w-full lg:absolute lg:top-10 lg:bottom-8 lg:left-0">
          <div className="container grid grid-cols-12">
            <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
              <ReportIndicatorsDesktop />
            </div>
          </div>
        </div>
      </Media>

      <Media lessThan="lg" className="flex h-full w-full grow flex-col">
        <ReportIndicatorsMobile />
      </Media>
    </Suspense>
  );
}
