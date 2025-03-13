"use client";

import { Media } from "@/containers/media";
import ReportResultsHeaderDesktop from "@/containers/results/header/desktop";
import ReportResultsHeaderMobile from "@/containers/results/header/mobile";

export default function ReportResultsHeader() {
  return (
    <>
      <Media greaterThanOrEqual="md">
        <ReportResultsHeaderDesktop />
      </Media>

      <Media lessThan="md">
        <ReportResultsHeaderMobile />
      </Media>
    </>
  );
}
