"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import * as geodesicAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPen, LuTrash2 } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import {
  getGeometryWithBuffer,
  useLocation,
  useLocationGeometryWithStatus,
  useLocationTitle,
} from "@/lib/location";

import { sketchActionAtom, sketchAtom, tmpBboxAtom, useSyncLocation } from "@/app/(frontend)/store";

import { BUFFERS } from "@/constants/map";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

if (!geodesicAreaOperator.isLoaded()) {
  await geodesicAreaOperator.load();
}

export default function CreateReport({ children }: { children?: ReactNode }) {
  const t = useTranslations();
  const [sketch, setSketch] = useAtom(sketchAtom);

  const setSketchAction = useSetAtom(sketchActionAtom);
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const { geometry: GEOMETRY, isCalculating } = useLocationGeometryWithStatus(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geodesicAreaOperator.execute(GEOMETRY, { unit: "square-kilometers" });
  }, [GEOMETRY]);

  // Local buffer value drives the slider/label live while dragging. We commit it to
  // the (shared) location state once per drag instead of once per pointer-move tick.
  const committedBuffer =
    (location && location.type !== "search" ? location.buffer : undefined) ||
    BUFFERS[LOCATION?.geometry?.type || "point"];
  const [bufferValue, setBufferValue] = useState(committedBuffer);

  // Latest dragged value, captured synchronously so the commit never reads a stale
  // React-state value. Radix only fires onValueCommit when its (controlled) value
  // differs from the slide-start value; on a fast drag the controlled value hasn't
  // flushed by pointer-up, so onValueCommit gets skipped and the buffer never updates.
  // A trailing debounce off onValueChange guarantees the final value commits.
  const pendingBufferRef = useRef(committedBuffer);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local slider state when the committed buffer changes from outside (reset,
  // upload, edit-location).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBufferValue(committedBuffer);
    pendingBufferRef.current = committedBuffer;
  }, [committedBuffer]);

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    };
  }, []);

  const commitBuffer = async () => {
    const value = pendingBufferRef.current;
    setLocation((prev) => (prev ? { ...prev, buffer: value } : prev));

    const geometry = LOCATION?.geometry;
    if (!location || !geometry || (location.type !== "point" && location.type !== "polyline")) {
      return;
    }

    const gWithBuffer = await getGeometryWithBuffer(geometry, value);
    if (gWithBuffer?.extent) {
      setTmpBbox(gWithBuffer.extent);
    }
  };

  const onValueChange = (value: number[]) => {
    pendingBufferRef.current = value[0];
    setBufferValue(value[0]);
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    commitTimeoutRef.current = setTimeout(commitBuffer, 120);
  };

  // Radix fires this on release for slow drags / track clicks. Commit immediately and
  // cancel the pending debounce; reads pendingBufferRef (not the possibly-stale arg).
  const onValueCommit = () => {
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
    commitBuffer();
  };

  if (!location || !LOCATION) return null;

  return (
    <div className="flex w-full flex-col justify-between gap-4 overflow-hidden bg-white text-sm">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground text-sm leading-none font-semibold uppercase">
            {TITLE}
          </div>
          <div className="text-foreground flex items-center gap-1 text-base leading-none font-bold">
            {isCalculating && <Spinner className="text-muted-foreground size-3.5" />}
            {formatNumber(AREA, {
              maximumFractionDigits: 0,
            })}{" "}
            km²
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="px-5"
                onClick={() => {
                  setLocation(null);
                  setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
                }}
              >
                <LuTrash2 className="h-5 w-5 text-current" />
                {/* {t("grid-sidebar-report-location-button-clear")} */}
              </Button>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent side="top" align="center">
                {t("grid-sidebar-report-location-button-clear")}
                <TooltipArrow className="fill-foreground" width={10} height={5} />
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          {location.type !== "search" && (
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant={sketch.enabled === "edit" ? "default" : "outline"}
                  className="px-5"
                  onClick={() => {
                    setSketch({
                      enabled: sketch.enabled === "edit" ? undefined : "edit",
                    });
                  }}
                >
                  <LuPen className="h-5 w-5 text-current" />
                </Button>
              </TooltipTrigger>

              <TooltipPortal>
                <TooltipContent side="top" align="center">
                  {sketch.enabled === "edit"
                    ? t("drawing-tools-edit-cancel")
                    : t("drawing-tools-edit")}
                  <TooltipArrow className="fill-foreground" width={10} height={5} />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {children}

          {/* <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full grow">
                {t("landing-key-features-grid-buttons-create-report")}
              </Button>
            </DialogTrigger>

            <DialogContent className="p-0">
              <DialogTitle className="sr-only">
                {t("landing-key-features-grid-buttons-create-report")}
              </DialogTitle>
              <ReportGenerate />
              <DialogClose />
            </DialogContent>
          </Dialog> */}
        </div>
      </section>

      {location.type !== "search" && LOCATION?.geometry?.type !== "polygon" && (
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="text-sm leading-none font-semibold text-blue-500">
              {t("grid-sidebar-report-location-buffer-size")}
            </div>
            <div className="text-foreground flex items-center gap-1 text-xs leading-none">
              {isCalculating && <Spinner className="text-muted-foreground size-3" />}
              {`${bufferValue} km`}
            </div>
          </div>
          <div className="space-y-1 px-1">
            <Slider
              min={1}
              max={100}
              step={1}
              value={[bufferValue]}
              minStepsBetweenThumbs={1}
              onValueChange={onValueChange}
              onValueCommit={onValueCommit}
            />

            <div className="text-2xs text-muted-foreground flex w-full justify-between font-bold">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>
        </section>
      )}

      {/* {location.type !== "search" && (
        <div className="text-sm tracking-[0.14px] text-muted-foreground">
          <ReactMarkdown>{t("grid-sidebar-report-location-note")}</ReactMarkdown>
        </div>
      )} */}
    </div>
  );
}
