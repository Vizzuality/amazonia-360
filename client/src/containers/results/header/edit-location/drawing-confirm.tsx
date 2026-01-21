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

import { sketchActionAtom, sketchAtom, useSyncLocation } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function EditLocationDrawingConfirm({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations();
  const [sketch, setSketch] = useAtom(sketchAtom);
  const [, setSketchAction] = useAtom(sketchActionAtom);

  const [location, setLocation] = useSyncLocation();
  const TITLE = useLocationTitle(location);
  const LOCATION = useLocation(location);
  const GEOMETRY = useLocationGeometry(location);

  const AREA = useMemo(() => {
    if (!GEOMETRY) return 0;
    return geodesicArea(GEOMETRY, "square-kilometers");
  }, [GEOMETRY]);

  if (!location || !LOCATION) return null;

  return (
    <div className="flex w-full items-center justify-between gap-4 text-sm">
      <header>
        <div className="text-nowrap font-semibold uppercase text-muted-foreground">{TITLE}</div>
        <div className="text-xs font-bold text-foreground">
          {formatNumber(AREA, {
            maximumFractionDigits: 0,
          })}{" "}
          km²
        </div>
      </header>
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

        <Button size="lg" className="grow" onClick={onConfirm}>
          {t("grid-sidebar-report-location-button-confirm")}
        </Button>
      </div>
    </div>
  );
}
