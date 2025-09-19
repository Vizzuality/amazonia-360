"use client";

import { useMemo } from "react";

import { geodesicArea } from "@arcgis/core/geometry/geometryEngine";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom, useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuPen, LuTrash2 } from "react-icons/lu";
import { useDebounce } from "rooks";

import { formatNumber } from "@/lib/formats";
import {
  getGeometryWithBuffer,
  useLocation,
  useLocationGeometry,
  useLocationTitle,
} from "@/lib/location";

import { sketchActionAtom, sketchAtom, tmpBboxAtom, useSyncLocation } from "@/app/store";

import { BUFFERS } from "@/constants/map";

import ReportGenerate from "@/containers/report/generate";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function CreateReport() {
  const t = useTranslations();
  const [sketch, setSketch] = useAtom(sketchAtom);

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
    return geodesicArea(GEOMETRY, "square-kilometers");
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

          <Dialog>
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
          </Dialog>
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

      {/* {location.type !== "search" && (
        <div className="text-sm tracking-[0.14px] text-muted-foreground">
          <ReactMarkdown>{t("grid-sidebar-report-location-note")}</ReactMarkdown>
        </div>
      )} */}
    </div>
  );
}
