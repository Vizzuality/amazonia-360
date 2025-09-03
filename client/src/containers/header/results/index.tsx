"use client";

import ReportResultsHeaderMobile from "@/containers/header/results/mobile";
import { Media } from "@/containers/media";
import ReportResultsTitleDesktop from "@/containers/results/header/title";

export default function ReportResultsHeader() {
  return (
    <>
      <Media greaterThanOrEqual="md">
        <ReportResultsTitleDesktop />
      </Media>

      <Media lessThan="md">
        <ReportResultsHeaderMobile />
      </Media>
    </>
  );
}
