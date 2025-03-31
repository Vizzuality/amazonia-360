"use client";

import { MouseEvent } from "react";

import { useAtom, useSetAtom } from "jotai";

import { cn } from "@/lib/utils";

import { sketchActionAtom, sketchAtom, useSyncLocation } from "@/app/store";

import { SketchProps } from "@/components/map/sketch";
import { Button } from "@/components/ui/button";

export default function SketchMobile() {
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
    <div
      className={cn(
        "absolute bottom-4 left-4 z-10 flex w-full max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border bg-white shadow-md",
      )}
    >
      <Button
        variant="default"
        className={cn(sketch.enabled && sketch.type === "polygon" && "border-cyan-500 bg-blue-50")}
        onClick={(e) => handleClick(e, "polygon")}
        type="button"
      >
        Start drawing
      </Button>
    </div>
  );
}
