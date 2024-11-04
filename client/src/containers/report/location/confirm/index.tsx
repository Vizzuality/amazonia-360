"use client";

import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";

import { formatNumber } from "@/lib/formats";
import { useLocationGeometry, useLocationTitle } from "@/lib/location";

import { confirmAtom, useSyncLocation } from "@/app/store";

import { Button } from "@/components/ui/button";
import { useSetAtom } from "jotai";

export default function Confirm() {
  const setConfirm = useSetAtom(confirmAtom);

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

        <Button size="lg" className="grow" onClick={() => setConfirm(true)}>
          Select
        </Button>
      </div>
    </div>
  );
}
