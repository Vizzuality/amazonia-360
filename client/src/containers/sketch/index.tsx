"use client";

import { MouseEvent } from "react";

import { useAtom } from "jotai";

import { sketchAtom } from "@/app/store";

import { SketchProps } from "@/components/map/sketch";
import { Button } from "@/components/ui/button";

export default function Sketch() {
  const [sketch, setSketch] = useAtom(sketchAtom);
  const handleClick = (
    e: MouseEvent<HTMLButtonElement>,
    type: SketchProps["type"],
  ) => {
    e.preventDefault();
    if (sketch.enabled && sketch.type === type) {
      return setSketch({ ...sketch, type });
    }

    return setSketch({ enabled: true, type });
  };

  return (
    <>
      <h1 className="text-2xl">Sketch</h1>

      <div className="flex space-x-1">
        <Button onClick={(e) => handleClick(e, "polygon")}>Polygon</Button>
        <Button onClick={(e) => handleClick(e, "polyline")}>Polyline</Button>
        <Button onClick={(e) => handleClick(e, "point")}>Point</Button>
      </div>
    </>
  );
}
