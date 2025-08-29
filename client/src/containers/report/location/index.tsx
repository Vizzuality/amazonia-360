"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportLocationDesktop from "@/containers/report/location/desktop";
import ReportLocationMobile from "@/containers/report/location/mobile";

export default function ReportLocation() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportLocationDesktop />
      </Media>

      <Media lessThan="lg" className="absolute flex h-full w-full grow flex-col">
        <ReportLocationMobile />
      </Media>
    </Suspense>
  );
}
