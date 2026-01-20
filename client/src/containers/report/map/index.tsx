"use client";

import { Suspense } from "react";

import MapContainer from "@/containers/map";
import { Media } from "@/containers/media";

import { usePathname } from "@/i18n/navigation";

export default function ReportMap() {
  const pathname = usePathname();
  console.log(pathname.includes("/grid"));

  return (
    <Suspense fallback={null}>
      <Media greaterThanOrEqual="lg" className="relative flex w-full grow flex-col">
        <MapContainer desktop gridEnabled={pathname.includes("/grid")} />
      </Media>

      <Media lessThan="lg" className="relative flex w-full grow flex-col">
        <MapContainer />
      </Media>
    </Suspense>
  );
}
