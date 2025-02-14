"use client";

import { useAtomValue } from "jotai";

import { sketchActionAtom } from "@/app/store";

const CREATE_MESSAGES = {
  polygon: {
    start: (
      <>
        <strong className="font-bold">Click</strong> on the map to start drawing a polygon. You can
        press <strong className="font-bold">ESC</strong> to cancel.
      </>
    ),
    active: (
      <>
        <strong className="font-bold">Click</strong> to add points and{" "}
        <strong className="font-bold">double-click</strong> to finish drawing. You can also press{" "}
        <strong className="font-bold">Enter</strong> to finish the polygon.
      </>
    ),
    complete: (
      <>
        Nice!! If you want to <strong className="font-bold">edit the shape</strong> you can click on
        it to enable the edition mode.
      </>
    ),
    cancel: null,
  },
  polyline: {
    start: (
      <>
        <strong className="font-bold">Click</strong> to start drawing a line.
      </>
    ),
    active: (
      <>
        <strong className="font-bold">Click</strong> to add points and{" "}
        <strong className="font-bold">double-click</strong> to finish drawing. You can also press{" "}
        <strong className="font-bold">Enter</strong> to finish the line.
      </>
    ),
    complete: (
      <>
        Nice!! If you want to <strong className="font-bold">edit the line</strong> you can click on
        it to enable the edition mode.
      </>
    ),
    cancel: null,
  },
  point: {
    start: (
      <>
        <strong className="font-bold">Click</strong> on the map to add a point.
      </>
    ),
    active: (
      <>
        <strong className="font-bold">Click</strong> on the map to add a point.
      </>
    ),
    complete: (
      <>
        Nice!! If you want to <strong className="font-bold">move the point</strong> you can click on
        it to enable the edition mode.
      </>
    ),
    cancel: null,
  },
} as const;

const UPDATE_MESSAGES = {
  polygon: {
    start: (
      <>
        Use the <strong className="font-bold">handles</strong> to edit the polygon. You can move
        them, add new ones or remove them. You can press <strong className="font-bold">ESC</strong>{" "}
        to cancel.
      </>
    ),
    active: (
      <>
        To confirm the new shape, please <strong className="font-bold">click out</strong> of the
        shape or press <strong className="font-bold">ESC</strong>.
      </>
    ),
    complete: null,
    cancel: null,
  },
  polyline: {
    start: (
      <>
        Use the <strong className="font-bold">handles</strong> to edit the line. You can move them,
        add new ones or remove them. You can use the slider to change the buffer size. You can press{" "}
        <strong className="font-bold">ESC</strong> to cancel.
      </>
    ),
    active: (
      <>
        To confirm the new shape, please <strong className="font-bold">click out</strong> of the
        shape or press <strong className="font-bold">ESC</strong>.
      </>
    ),
    complete: null,
    cancel: null,
  },
  point: {
    start: (
      <>
        Use the <strong className="font-bold">handle</strong> to move the point. You can use the
        slider to change the buffer size. You can press <strong className="font-bold">ESC</strong>{" "}
        to cancel.
      </>
    ),
    active: (
      <>
        To confirm the new position, please <strong className="font-bold">click out</strong> of the
        point or press <strong className="font-bold">ESC</strong>
      </>
    ),
    complete: null,
    cancel: null,
  },
} as const;

export const SketchTooltips = () => {
  const sketchAction = useAtomValue(sketchActionAtom);

  if (
    !sketchAction.type ||
    !sketchAction.geometryType ||
    (sketchAction.geometryType !== "polygon" &&
      sketchAction.geometryType !== "polyline" &&
      sketchAction.geometryType !== "point")
  )
    return null;

  return (
    <div className="absolute bottom-6 left-0 z-10 w-full duration-300 animate-in fade-in-0">
      <div className="container">
        <div className="grid grid-cols-12">
          <div className="col-span-5 col-start-7">
            <div className="flex justify-center">
              <div className="rounded bg-white p-2 shadow-md">
                <p className="text-center text-sm font-light text-foreground">
                  {sketchAction.type === "create" &&
                    CREATE_MESSAGES[`${sketchAction.geometryType}`][sketchAction?.state ?? "start"]}

                  {sketchAction.type === "update" &&
                    UPDATE_MESSAGES[`${sketchAction.geometryType}`][sketchAction?.state ?? "start"]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
};
