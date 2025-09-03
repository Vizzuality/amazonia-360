"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import MapContainer from "@/containers/report/map/map";

export default function ReportMap() {
  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="relative flex w-full grow flex-col">
        <MapContainer desktop />
      </Media>

      <Media lessThan="lg" className="relative flex w-full grow flex-col">
        <MapContainer />
      </Media>
    </Suspense>
  );
}
