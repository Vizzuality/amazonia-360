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
    <div className="flex w-full flex-col justify-between gap-4 overflow-hidden rounded-lg bg-blue-50 p-4 text-sm">
      <div className="flex items-end justify-between">
        <div className="text-sm font-semibold leading-tight">{TITLE}</div>
        <div className="text-gray-500">
          {formatNumber(AREA, {
            maximumFractionDigits: 0,
          })}{" "}
          km²
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="lg" className="grow" onClick={() => setLocation(null)}>
          Clear
        </Button>
        <Link href={`/report/topics${searchParams}`} className="grow">
          <Button size="lg" className="w-full">
            Select
          </Button>
        </Link>
      </div>
    </div>
  );
}
