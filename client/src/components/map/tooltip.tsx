import { gridCellHighlightAtom } from "@/app/store";
import Point from "@arcgis/core/geometry/Point";
import { cellToLatLng } from "h3-js";
import { useAtom } from "jotai";
import React, { useState, useEffect } from "react";
import { useMap } from "./provider";
import { HexagonIcon } from "../ui/icons/hexagon";

export const Tooltip = () => {
  const [cell] = useAtom(gridCellHighlightAtom);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const map = useMap();

  const view = map?.view;

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

  if (!position || !cell.id) return null;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-[40px] transform items-center space-x-2 rounded bg-cyan-500 px-2 text-white before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[6px] before:border-x-transparent before:border-b-transparent before:border-t-cyan-500"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <HexagonIcon className="h-4 w-4" />
      <span>{+cell.id + 1}º</span>
    </div>
  );
};

export default Tooltip;
