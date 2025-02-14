"use client";

import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";
import { useSetAtom } from "jotai";

import { formatNumber } from "@/lib/formats";
import { useLocation, useLocationGeometry, useLocationTitle } from "@/lib/location";

import { reportPanelAtom, sketchActionAtom, useSyncLocation } from "@/app/store";

import { BUFFERS } from "@/constants/map";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function Confirm() {
  const setReportPanel = useSetAtom(reportPanelAtom);
  const setSketchAction = useSetAtom(sketchActionAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const GEOMETRY = useLocationGeometry(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geometryEngine.geodesicArea(GEOMETRY as Polygon, "square-kilometers");
  }, [GEOMETRY]);

  const onValueChange = (value: number[]) => {
    setLocation((prev) => {
      if (prev) {
        return {
          ...prev,
          buffer: value[0],
        };
      }
      return prev;
    });
  };

  if (!location) return null;

  return (
    <div className="flex w-full flex-col justify-between gap-2 overflow-hidden text-sm">
      <div className="flex items-end justify-between">
        <div className="text-sm font-semibold leading-tight text-foreground">{TITLE}</div>
        <div className="text-xs text-gray-500">
          {formatNumber(AREA, {
            maximumFractionDigits: 0,
          })}{" "}
          km²
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="lg"
          className="grow"
          onClick={() => {
            setLocation(null);
            setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
          }}
        >
          Clear
        </Button>

        <Button size="lg" className="grow" onClick={() => setReportPanel("topics")}>
          Confirm
        </Button>
      </div>

      <p className="text-sm tracking-[0.14px] text-muted-foreground">
        To edit the shape, <strong>click</strong> on the shape.
      </p>

      {location.type !== "search" && LOCATION?.geometry.type !== "polygon" && (
        <>
          <p className="text-sm tracking-[0.14px] text-muted-foreground">
            You can adjust the buffer (
            {`${location.buffer || BUFFERS[LOCATION?.geometry.type || "point"]} km`}) by{" "}
            <strong>moving</strong> the following slider.
          </p>
          <div className="space-y-1 px-1">
            <Slider
              min={1}
              max={100}
              step={1}
              value={[location.buffer || BUFFERS[LOCATION?.geometry.type || "point"]]}
              minStepsBetweenThumbs={1}
              onValueChange={onValueChange}
            />

            <div className="flex w-full justify-between text-2xs font-bold text-muted-foreground">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
