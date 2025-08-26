"use client";

import { Media } from "@/containers/media";
import ReportResultsHeaderMobile from "@/containers/results/header/mobile";
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
