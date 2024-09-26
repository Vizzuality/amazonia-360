"use client";

import { useMemo } from "react";

import Link from "next/link";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry, useLocationTitle } from "@/lib/location";

import { useSyncLocation, useSyncSearchParams } from "@/app/store";

import { Button } from "@/components/ui/button";

export default function Confirm() {
  const searchParams = useSyncSearchParams();

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const GEOMETRY = useLocationGeometry(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geometryEngine.geodesicArea(GEOMETRY as Polygon, "square-kilometers");
  }, [GEOMETRY]);

  if (!location) return null;

  return (
    <div className="flex w-full items-center justify-between space-x-2 overflow-hidden rounded-[16px] bg-white px-5 py-5 text-sm">
      <div className="grow">
        <div className="text-lg font-bold leading-tight">{TITLE}</div>
        <div className="text-gray-500">
          {formatNumber(AREA, {
            maximumFractionDigits: 0,
          })}{" "}
          km²
        </div>
      </div>
      <div className="shrink-0 space-x-2">
        <Button variant="outline" size="lg" onClick={() => setLocation(null)}>
          Clear
        </Button>
        <Link href={`/report/topics${searchParams}`}>
          <Button size="lg">Select</Button>
        </Link>
      </div>
    </div>
  );
}
