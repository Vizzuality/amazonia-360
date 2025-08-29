"use client";

import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Polygon from "@arcgis/core/geometry/Polygon";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useSetAtom, useAtom, useAtomValue } from "jotai";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { LuCheck, LuPen, LuX } from "react-icons/lu";
// import { useDebounce } from "rooks";

import { formatNumber } from "@/lib/formats";
import {
  // getGeometryWithBuffer,
  useLocation,
  useLocationGeometry,
  useLocationTitle,
} from "@/lib/location";

import {
  reportPanelAtom,
  sketchActionAtom,
  //  tmpBboxAtom,
  useSyncLocation,
} from "@/app/store";

import SidebarIndicatorsContent from "@/containers/report/location/tabs/topics";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ConfirmLocation() {
  const t = useTranslations();
  const setReportPanel = useSetAtom(reportPanelAtom);
  const [sketchAction, setSketchAction] = useAtom(sketchActionAtom);
  const reportPanel = useAtomValue(reportPanelAtom);

  // const setTmpBbox = useSetAtom(tmpBboxAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const GEOMETRY = useLocationGeometry(location);

  // const onValueChangeDebounced = useDebounce(() => {
  //   if (!location || (location.type !== "point" && location.type !== "polyline")) return;
  //   const gWithBuffer = getGeometryWithBuffer(GEOMETRY, location.buffer);

  //   if (gWithBuffer) {
  //     setTmpBbox(gWithBuffer.extent);
  //   }
  // }, 500);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geometryEngine.geodesicArea(GEOMETRY as Polygon, "square-kilometers");
  }, [GEOMETRY]);

  // const onValueChange = (value: number[]) => {
  //   setLocation((prev) => {
  //     if (prev) {
  //       return {
  //         ...prev,
  //         buffer: value[0],
  //       };
  //     }
  //     return prev;
  //   });

  //   onValueChangeDebounced();
  // };

  if (!location || !LOCATION) return null;

  return (
    <div className="flex w-full items-center justify-between space-x-2 text-sm">
      <div className="font-semibold uppercase text-muted-foreground">{TITLE}</div>
      <div className="text-xs font-bold text-foreground">
        {formatNumber(AREA, {
          maximumFractionDigits: 0,
        })}{" "}
        km²
      </div>
      {/* <Button
            variant="outline"
            size="lg"
            className="grow"
            onClick={() => {
              setLocation(null);
              setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
            }}
          >
            {t("grid-sidebar-report-location-button-clear")}
          </Button> */}
      {reportPanel === "topics" && (
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 p-0"
                variant="outline"
                onClick={() => {
                  setSketchAction({
                    ...sketchAction,
                    type: "update",
                    state: "start",
                    geometryType: "polygon",
                  });
                }}
              >
                <LuPen className="h-5 w-5 text-blue-500" />
              </Button>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent side="bottom" align="center">
                {t("drawing-tools-edit")}
                <TooltipArrow className="fill-foreground" width={10} height={5} />
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-10 p-0"
                onClick={() => {
                  setLocation(null);
                  setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
                }}
              >
                <Trash2 className="h-5 w-5 text-blue-500" />
              </Button>
            </TooltipTrigger>

            <TooltipPortal>
              <TooltipContent side="bottom" align="center">
                {t("drawing-tools-clear")}
                <TooltipArrow className="fill-foreground" width={10} height={5} />
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="grow">
                {t("landing-key-features-grid-buttons-create-report")}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl p-0">
              <DialogTitle className="sr-only">
                {t("landing-key-features-grid-buttons-create-report")}
              </DialogTitle>
              <SidebarIndicatorsContent />
              <DialogClose />
            </DialogContent>
          </Dialog>
        </div>
      )}
      {reportPanel !== "topics" && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="lg"
            className="grow justify-between space-x-2.5 px-4 py-2"
            onClick={() => {
              setLocation(null);
              setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
            }}
          >
            <LuX className="h-4 w-4" />
            <span>{t("cancel")}</span>
          </Button>

          <Button
            size="lg"
            className="grow justify-between space-x-2.5 px-4 py-2"
            onClick={() => {
              setReportPanel("topics");
            }}
          >
            <LuCheck className="h-4 w-4" />
            <span>{t("grid-sidebar-report-location-button-confirm")}</span>
          </Button>
        </div>
      )}
      {/* {location.type !== "search" && LOCATION?.geometry.type !== "polygon" && (
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="text-sm font-semibold leading-none text-blue-500">
              {t("grid-sidebar-report-location-buffer-size")}
            </div>
            <div className="text-xs leading-none text-foreground">
              {`${location.buffer || BUFFERS[LOCATION?.geometry.type || "point"]} km`}
            </div>
          </div>
          <div className="space-y-1 px-1"> */}
      {/* <Slider
              min={1}
              max={100}
              step={1}
              value={[location.buffer || BUFFERS[LOCATION?.geometry.type || "point"]]}
              minStepsBetweenThumbs={1}
              onValueChange={onValueChange}
            /> */}
      {/* 
            <div className="flex w-full justify-between text-2xs font-bold text-muted-foreground">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>
        </section>
      )} */}
    </div>
  );
}
