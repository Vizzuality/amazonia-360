"use client";

import React, { useMemo } from "react";

import Point from "@arcgis/core/geometry/Point";
import { cellToLatLng } from "h3-js";
import { useAtomValue } from "jotai";

import { cn } from "@/lib/utils";

import { gridCellHighlightAtom } from "@/app/(frontend)/store";

import { HexagonIcon } from "../ui/icons/hexagon";

import { useMap } from "./provider";

export const Tooltip = () => {
  const cell = useAtomValue(gridCellHighlightAtom);

  const map = useMap();

  const view = map?.view;
  const zoom = map?.view?.zoom;

  const position = useMemo(() => {
    if (!cell.index || !view) return null;

    const latLng = cellToLatLng(cell.index);
    const point = new Point({
      longitude: latLng[1],
      latitude: latLng[0],
    });

    const screenPoint = view.toScreen(point);

    return { x: screenPoint?.x, y: screenPoint?.y };
  }, [cell, view]);

  if (!position || typeof cell.id !== "number") return null;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-[200%] transform items-center space-x-2 rounded bg-cyan-500 px-2 text-white before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-x-transparent before:border-t-cyan-500 before:border-b-transparent"
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
