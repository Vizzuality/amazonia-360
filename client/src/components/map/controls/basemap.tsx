"use client";

import { FC, useCallback } from "react";

import Image from "next/image";

import Basemap from "@arcgis/core/Basemap";
import { PopoverArrow } from "@radix-ui/react-popover";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuLayers } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { useMap } from "@/components/map/provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export const BasemapControl: FC<BasemapControlProps> = ({
  className,
}: BasemapControlProps) => {
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
              aria-label="Basemap"
              type="button"
            >
              <LuLayers className="h-full w-full" />
            </button>
          </TooltipTrigger>
        </PopoverTrigger>

        <PopoverContent
          side="left"
          align="start"
          className="bg-background w-auto p-0"
        >
          <ul className="flex flex-col">
            {BASEMAPS.map((b) => {
              return (
                <li key={b.id} className="flex">
                  <button
                    className={cn({
                      "flex items-center p-2 w-full space-x-2 hover:bg-muted group transition-colors duration-200":
                        true,
                      "bg-foreground hover:bg-foreground":
                        map?.map.basemap?.id === b.id,
                    })}
                    type="button"
                    onClick={() => handleBasemap(b.id)}
                  >
                    <div className="shrink-0 w-16 shadow-sm">
                      <Image
                        src={b.basemap.thumbnailUrl}
                        alt={b.label}
                        width={200}
                        height={133}
                        className="group-hover:scale-105 transition-transform duration-200 ease-in-out"
                      />
                    </div>
                    <span
                      className={cn({
                        "text-foreground text-xs transition-colors": true,
                        "text-background": map?.map.basemap?.id === b.id,
                      })}
                    >
                      {b.label}
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
            Basemap
            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Popover>
  );
};

export default BasemapControl;
