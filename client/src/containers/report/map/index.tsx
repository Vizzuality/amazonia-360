"use client";

import { Suspense } from "react";

import MapContainer from "@/containers/map";
import { Media } from "@/containers/media";

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
