"use client";

import { MouseEvent } from "react";

import { useAtom, useSetAtom } from "jotai";

import { cn } from "@/lib/utils";

import { sketchActionAtom, sketchAtom, useSyncLocation } from "@/app/store";

import { SketchProps } from "@/components/map/sketch";
import { PointIcon } from "@/components/ui/icons/point";
import { PolygonIcon } from "@/components/ui/icons/polygon";
import { PolylineIcon } from "@/components/ui/icons/polyline";

const SKETCH_BUTTONS = [
  {
    id: "point",
    label: "Point",
    description: "Click on the map to select a single point and get a buffer radius of 30km²",
    Icon: PointIcon,
  },
  {
    id: "polygon",
    label: "Area",
    description: "Draw your custom area of interest",
    Icon: PolygonIcon,
  },
  {
    id: "polyline",
    label: "Line",
    description: "Draw a line a get a buffer around it of 10km²",
    Icon: PolylineIcon,
  },
] as const;

export default function Sketch() {
  const [sketch, setSketch] = useAtom(sketchAtom);
  const setSketchAction = useSetAtom(sketchActionAtom);
  const [, setLocation] = useSyncLocation();

  const handleClick = (e: MouseEvent<HTMLButtonElement>, type: SketchProps["type"]) => {
    e.preventDefault();
    setLocation(null);

    if (sketch.enabled && sketch.type === type) {
      setSketch({ enabled: false, type: undefined });
      setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
    }

    if (sketch.enabled && sketch.type !== type) {
      setSketch({ enabled: false, type: undefined });

      setTimeout(() => {
        setSketch({ enabled: true, type });
        setSketchAction({ type: "create", state: "start", geometryType: type });
      }, 0);
    }

    if (!sketch.enabled) {
      setSketch({ enabled: true, type });
      setSketchAction({ type: "create", state: "start", geometryType: type });
    }
  };

  return (
    <div className={cn("flex w-full flex-col items-center space-y-2 overflow-y-scroll text-sm")}>
      {SKETCH_BUTTONS.map((button) => {
        const Icon = button.Icon;

        return (
          <button
            key={button.id}
            className={cn(
              "h-full w-full grow overflow-hidden rounded-lg border border-border bg-white p-1 text-left transition-all duration-500 hover:bg-blue-100",
              sketch.enabled && sketch.type === button.id && "border-cyan-500 bg-blue-50",
            )}
            onClick={(e) => handleClick(e, button.id)}
          >
            <div className={cn("flex items-center space-x-2.5 transition-transform duration-300")}>
              <div className="rounded-sm bg-cyan-100 p-6">
                <Icon className="h-10 w-10 text-primary" />
              </div>
              <div className="flex flex-col items-start justify-start space-y-1">
                <span className="text-base font-bold transition-none">{button.label}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {button.description}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
