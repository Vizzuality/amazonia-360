"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportIndicatorsDesktop from "@/containers/report/indicators/desktop";
import ReportIndicatorsMobile from "@/containers/report/indicators/mobile";

export default function ReportIndicators() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportIndicatorsDesktop />
      </Media>

      <Media lessThan="lg" className="flex h-full w-full grow flex-col">
        <ReportIndicatorsMobile />
      </Media>
    </Suspense>
  );
}
