"use client";

import { FC, useCallback, MouseEvent, useRef, useMemo, useState, useEffect } from "react";

import ZoomVM from "@arcgis/core/widgets/Zoom/ZoomViewModel";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuMinus, LuPlus } from "react-icons/lu";
import { useDebounce } from "rooks";

import { cn } from "@/lib/utils";

import { useMap } from "@/components/map/provider";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CONTROL_BUTTON_STYLES } from "./constants";

interface ZoomControlProps {
  className?: string;
}

export const ZoomControl: FC<ZoomControlProps> = ({ className }: ZoomControlProps) => {
  const t = useTranslations();
  const zoomViewModelRef = useRef<ZoomVM>();

  const map = useMap();

  const [zoom, setZoom] = useState<number | undefined>(map?.view.zoom);
  const setZoomDebounced = useDebounce((z: number) => {
    setZoom(z);
  }, 100);

  useMemo(() => {
    if (!zoomViewModelRef.current) {
      zoomViewModelRef.current = new ZoomVM({
        view: map?.view,
        canZoomIn: true,
        canZoomOut: true,
      });
    }
  }, [map?.view]);

  const minZoom = map?.view.constraints?.minZoom;
  const maxZoom = map?.view.constraints?.maxZoom;

  useEffect(() => {
    map?.view.watch("zoom", (z) => {
      setZoomDebounced(z);
    });
  }, [map?.view, setZoomDebounced]);

  const increaseZoom = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    zoomViewModelRef.current?.zoomIn();
  }, []);

  const decreaseZoom = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    zoomViewModelRef.current?.zoomOut();
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-full border border-border bg-white",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn({
              [CONTROL_BUTTON_STYLES.default]: true,
              [CONTROL_BUTTON_STYLES.hover]: zoom !== maxZoom,
              [CONTROL_BUTTON_STYLES.active]: zoom !== maxZoom,
              [CONTROL_BUTTON_STYLES.disabled]: zoom === maxZoom,
              "rounded-none border-0": true,
            })}
            aria-label={t("zoom-in")}
            type="button"
            disabled={zoom === maxZoom}
            onClick={increaseZoom}
          >
            <LuPlus className="h-full w-full" />
          </button>
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent side="left" align="center">
            <div className="text-xxs">{t("zoom-in")}</div>

            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn({
              [CONTROL_BUTTON_STYLES.default]: true,
              [CONTROL_BUTTON_STYLES.hover]: zoom !== minZoom,
              [CONTROL_BUTTON_STYLES.active]: zoom !== minZoom,
              [CONTROL_BUTTON_STYLES.disabled]: zoom === minZoom,
              "rounded-none border-0": true,
            })}
            aria-label={t("zoom-out")}
            type="button"
            disabled={zoom === minZoom}
            onClick={decreaseZoom}
          >
            <LuMinus className="h-full w-full" />
          </button>
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent side="left" align="center">
            <div className="text-xxs">{t("zoom-out")}</div>

            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </div>
  );
};

export default ZoomControl;
