"use client";

import { FC, useCallback } from "react";

import Image from "next/image";

import Basemap from "@arcgis/core/Basemap";
import { PopoverArrow } from "@radix-ui/react-popover";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuLayers } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useMap } from "@/components/map/provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CONTROL_BUTTON_STYLES } from "./constants";
const BASEMAPS = [
  {
    id: "gray-vector",
    label: "Gray",
    basemap: Basemap.fromId("gray-vector"),
  },
  {
    id: "dark-gray-vector",
    label: "Dark Gray",
    basemap: Basemap.fromId("dark-gray-vector"),
  },
  {
    id: "satellite",
    label: "Satellite",
    basemap: Basemap.fromId("satellite"),
  },
  {
    id: "streets",
    label: "Streets",
    basemap: Basemap.fromId("streets"),
  },
  {
    id: "hybrid",
    label: "Hybrid",
    basemap: Basemap.fromId("hybrid"),
  },
  {
    id: "osm",
    label: "OSM",
    basemap: Basemap.fromId("osm"),
  },
  {
    id: "topo-vector",
    label: "Topographic",
    basemap: Basemap.fromId("topo-vector"),
  },
  {
    id: "terrain",
    label: "Terrain",
    basemap: Basemap.fromId("terrain"),
  },
] as const;
export type BasemapIds = (typeof BASEMAPS)[number]["id"];

interface BasemapControlProps {
  className?: string;
}

export const BasemapControl: FC<BasemapControlProps> = ({ className }: BasemapControlProps) => {
  const t = useTranslations();

  const map = useMap();

  const handleBasemap = useCallback(
    (id: BasemapIds) => {
      if (map) {
        map.map.basemap = Basemap.fromId(id);
      }
    },
    [map],
  );

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
            {BASEMAPS.map((b) => {
              return (
                <li key={b.id} className="flex">
                  <button
                    className={cn({
                      "group flex w-full items-center space-x-2 p-2 transition-colors duration-200 hover:bg-muted":
                        true,
                      "bg-foreground hover:bg-foreground": map?.map.basemap?.id === b.id,
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
                        "text-background": map?.map.basemap?.id === b.id,
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
