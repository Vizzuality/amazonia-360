"use client";

import { useMemo } from "react";

import Link from "next/link";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";

import { useSyncLocation, useSyncSearchParams } from "@/app/store";

import { Button } from "@/components/ui/button";

export default function Confirm() {
  const searchParams = useSyncSearchParams();

  const [location, setLocation] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { format } = formatNumber({
    maximumFractionDigits: 0,
  });

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geometryEngine.geodesicArea(
      GEOMETRY as Polygon,
      "square-kilometers",
    );
  }, [GEOMETRY]);

  if (!location) return null;

  return (
    <div className="flex w-full rounded-[16px] py-5 px-5 text-sm bg-white items-center overflow-hidden justify-between">
      <div className="flex-grow">
        <div className="text-lg font-bold">Selected Area</div>
        <div className="text-gray-500">{format(AREA)} km²</div>
      </div>
      <div className="space-x-2">
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
