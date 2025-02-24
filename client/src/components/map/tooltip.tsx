import React, { useState, useEffect } from "react";

import Point from "@arcgis/core/geometry/Point";
import { cellToLatLng } from "h3-js";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import { gridCellHighlightAtom } from "@/app/store";

import { HexagonIcon } from "../ui/icons/hexagon";

import { useMap } from "./provider";

export const Tooltip = () => {
  const cell = useAtomValue(gridCellHighlightAtom);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const map = useMap();

  const view = map?.view;
  const zoom = map?.view.zoom;

  useEffect(() => {
    if (!cell.index || !view) {
      setPosition(null);
      return;
    }

    const latLng = cellToLatLng(cell.index);
    const point = new Point({
      longitude: latLng[1],
      latitude: latLng[0],
    });

    const screenPoint = view.toScreen(point);

    setPosition({ x: screenPoint.x, y: screenPoint.y });
  }, [cell, view]);

  if (!position || typeof cell.id !== "number") return null;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-[200%] transform items-center space-x-2 rounded bg-cyan-500 px-2 text-white before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[6px] before:border-x-transparent before:border-b-transparent before:border-t-cyan-500"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <HexagonIcon className={cn("h-4 w-4", { "h-8 w-8": zoom && zoom >= 10 })} />
      <span className={cn({ "p-3 text-2xl": zoom && zoom >= 10 })}>{+cell.id + 1}º</span>
    </div>
  );
};

export default Tooltip;
