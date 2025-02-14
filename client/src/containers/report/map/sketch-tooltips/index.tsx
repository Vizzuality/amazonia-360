"use client";

import { useAtomValue } from "jotai";

import { sketchActionAtom } from "@/app/store";

const CREATE_MESSAGES = {
  polygon: {
    start: (
      <>
        <strong>Click</strong> to start drawing a polygon
      </>
    ),
    active: (
      <>
        <strong>Double-click</strong> to finish drawing a polygon,
      </>
    ),
    complete: (
      <>
        Nice!! If you want to <strong>edit the shape</strong> you can click on it to enable the
        edition mode
      </>
    ),
    cancel: <>Canceled</>,
  },
  polyline: {
    start: (
      <>
        <strong>Click</strong> to start drawing a line
      </>
    ),
    active: (
      <>
        <strong>Click</strong> to continue drawing a line
      </>
    ),
    complete: (
      <>
        Nice!! If you want to <strong>edit the line</strong> you can click on it to enable the
        edition mode
      </>
    ),
    cancel: <>Canceled</>,
  },
  point: {
    start: (
      <>
        <strong>Click</strong> on the map to add a point
      </>
    ),
    active: (
      <>
        <strong>Click</strong> on the map to add a point
      </>
    ),
    complete: (
      <>
        Nice!! If you want to <strong>move the point</strong> you can click on it to enable the
        edition mode
      </>
    ),
    cancel: <>Canceled</>,
  },
} as const;

const UPDATE_MESSAGES = {
  polygon: {
    start: (
      <>
        Use the <strong>handles</strong> to edit the polygon. You can move them, add new ones or
        remove them
      </>
    ),
    active: (
      <>
        To confirm the new shape, please <strong>click out</strong> of the shape or press{" "}
        <strong>ESC</strong>
      </>
    ),
    complete: <>Nice</>,
    cancel: <>Canceled</>,
  },
  polyline: {
    start: (
      <>
        Use the <strong>handles</strong> to edit the line. You can move them, add new ones or remove
        them. You can use the slider to change the buffer size
      </>
    ),
    active: (
      <>
        To confirm the new shape, please <strong>click out</strong> of the shape or press{" "}
        <strong>ESC</strong>
      </>
    ),
    complete: <>Nice</>,
    cancel: <>Canceled</>,
  },
  point: {
    start: (
      <>
        Use the <strong>handle</strong> to move the point. You can use the slider to change the
        buffer size
      </>
    ),
    active: (
      <>
        To confirm the new position, please <strong>click out</strong> of the point or press{" "}
        <strong>ESC</strong>
      </>
    ),
    complete: <>Nice</>,
    cancel: <>Canceled</>,
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
                <p className="text-center text-sm text-foreground">
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
