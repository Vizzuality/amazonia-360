"use client";

import { FC, useCallback, useMemo } from "react";

import Image from "next/image";

import Basemap from "@arcgis/core/Basemap";
import { PopoverArrow } from "@radix-ui/react-popover";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuLayers } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { BasemapIds, BASEMAPS } from "@/constants/basemaps";

import { useMap } from "@/components/map/provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CONTROL_BUTTON_STYLES } from "./constants";

export interface BasemapControlProps {
  className?: string;
  onBasemapChange?: (selectedBasemapId: BasemapIds) => void;
}

export const BasemapControl: FC<BasemapControlProps> = ({
  className,
  onBasemapChange,
}: BasemapControlProps) => {
  const t = useTranslations();
  const mapContext = useMap();

  const handleBasemap = useCallback(
    (selectedBasemapId: BasemapIds) => {
      if (mapContext?.map) {
        mapContext.map.basemap = Basemap.fromId(selectedBasemapId);
        onBasemapChange && onBasemapChange(selectedBasemapId);
      }
    },
    [mapContext, onBasemapChange],
  );

  const BS = useMemo(() => {
    return BASEMAPS.map((b) => ({
      ...b,
      basemap: Basemap.fromId(b.id),
    }));
  }, []);

  const activeBasemapId = useMemo(() => mapContext?.map?.basemap?.id, [mapContext?.map?.basemap]);

  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button
              className={cn({
                [CONTROL_BUTTON_STYLES.default]: true,
                [CONTROL_BUTTON_STYLES.hover]: true,
                [CONTROL_BUTTON_STYLES.active]: true,
                [`${className}`]: !!className,
              })}
              aria-label={t("basemap")}
              type="button"
            >
              <LuLayers className="h-full w-full" />
            </button>
          </TooltipTrigger>
        </PopoverTrigger>

        <PopoverContent side="left" align="start" className="w-auto bg-background p-0">
          <ul className="flex flex-col">
            {BS.map((b) => {
              return (
                <li key={b.id} className="flex">
                  <button
                    className={cn({
                      "group flex w-full items-center space-x-2 p-2 transition-colors duration-200 hover:bg-muted":
                        //
                        true,
                      "bg-foreground hover:bg-foreground": activeBasemapId === b.id,
                    })}
                    type="button"
                    onClick={() => handleBasemap(b.id)}
                  >
                    <div className="w-16 shrink-0 shadow-sm">
                      <Image
                        src={b.basemap.thumbnailUrl}
                        alt={t(`${b.label}`)}
                        width={200}
                        height={133}
                        className="transition-transform duration-200 ease-in-out group-hover:scale-105"
                      />
                    </div>
                    <span
                      className={cn({
                        "text-xs text-foreground transition-colors": true,
                        "text-background": activeBasemapId === b.id,
                      })}
                    >
                      {t(`${b.label}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <PopoverArrow className="fill-background" width={10} height={5} />
        </PopoverContent>

        <TooltipPortal>
          <TooltipContent side="left" align="center">
            {t("basemap")}
            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Popover>
  );
};

export default BasemapControl;
