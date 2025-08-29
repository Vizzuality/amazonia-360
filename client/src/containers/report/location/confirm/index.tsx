"use client";

import { useMemo } from "react";

import ReactMarkdown from "react-markdown";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";
import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useDebounce } from "rooks";

import { formatNumber } from "@/lib/formats";
import {
  getGeometryWithBuffer,
  useLocation,
  useLocationGeometry,
  useLocationTitle,
} from "@/lib/location";

import { reportPanelAtom, sketchActionAtom, tmpBboxAtom, useSyncLocation } from "@/app/store";

import { BUFFERS } from "@/constants/map";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function Confirm() {
  const t = useTranslations();
  const setReportPanel = useSetAtom(reportPanelAtom);
  const setSketchAction = useSetAtom(sketchActionAtom);
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const GEOMETRY = useLocationGeometry(location);

  const onValueChangeDebounced = useDebounce(() => {
    if (!location || (location.type !== "point" && location.type !== "polyline")) return;
    const gWithBuffer = getGeometryWithBuffer(GEOMETRY, location.buffer);

    if (gWithBuffer) {
      setTmpBbox(gWithBuffer.extent);
    }
  }, 500);

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

    onValueChangeDebounced();
  };

  if (!location || !LOCATION) return null;

  return (
    <div className="flex w-full flex-col justify-between gap-4 overflow-hidden bg-white text-sm">
      <section className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="text-sm font-semibold leading-none text-blue-500">{TITLE}</div>
          <div className="text-xs leading-none text-foreground">
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
            {t("grid-sidebar-report-location-button-clear")}
          </Button>

          <Button size="lg" className="grow" onClick={() => setReportPanel("topics")}>
            {t("grid-sidebar-report-location-button-confirm")}
          </Button>
        </div>
      </section>

      {location.type !== "search" && LOCATION?.geometry.type !== "polygon" && (
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="text-sm font-semibold leading-none text-blue-500">
              {t("grid-sidebar-report-location-buffer-size")}
            </div>
            <div className="text-xs leading-none text-foreground">
              {`${location.buffer || BUFFERS[LOCATION?.geometry.type || "point"]} km`}
            </div>
          </div>
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
        </section>
      )}

      {location.type !== "search" && (
        <div className="text-sm tracking-[0.14px] text-muted-foreground">
          <ReactMarkdown>{t("grid-sidebar-report-location-note")}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
