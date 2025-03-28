"use client";

import { Media } from "@/containers/media";
import ReportLocationDesktop from "@/containers/report/location/desktop";
import ReportLocationMobile from "@/containers/report/location/mobile";

export default function ReportLocation() {
  return (
    <>
      <Media greaterThanOrEqual="lg" className="relative flex w-full grow flex-col">
        <ReportLocationDesktop />
      </Media>

      <Media lessThan="lg" className="relative flex w-full grow flex-col">
        <ReportLocationMobile />
      </Media>
    </>
  );
}
