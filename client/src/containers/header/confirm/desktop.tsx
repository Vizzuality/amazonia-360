"use client";

import { useMemo } from "react";

import { geodesicArea } from "@arcgis/core/geometry/geometryEngine";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtom } from "jotai";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { LuPen } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import { useLocation, useLocationGeometry, useLocationTitle } from "@/lib/location";

import { sketchActionAtom, sketchAtom, useSyncLocation } from "@/app/store";

import ReportGenerate from "@/containers/report/location/generate";

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
  const [sketch, setSketch] = useAtom(sketchAtom);
  const [, setSketchAction] = useAtom(sketchActionAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const GEOMETRY = useLocationGeometry(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geodesicArea(GEOMETRY as __esri.Polygon, "square-kilometers");
  }, [GEOMETRY]);

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
      <div className="flex items-center space-x-2">
        {location.type !== "search" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 p-0"
                variant={sketch.enabled === "edit" ? "default" : "outline"}
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
              <TooltipContent side="bottom" align="center">
                {sketch.enabled === "edit"
                  ? t("drawing-tools-edit-cancel")
                  : t("drawing-tools-edit")}
                <TooltipArrow className="fill-foreground" width={10} height={5} />
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        )}

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

          <DialogContent className="max-w-lg p-0">
            <DialogTitle className="sr-only">
              {t("landing-key-features-grid-buttons-create-report")}
            </DialogTitle>
            <ReportGenerate />
            <DialogClose />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
