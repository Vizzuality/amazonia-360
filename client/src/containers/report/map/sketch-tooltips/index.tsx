"use client";

import { useAtomValue } from "jotai";

import { sketchActionAtom } from "@/app/store";

const CREATE_MESSAGES = {
  polygon: {
    start: (
      <>
        To get started, <strong className="font-bold">click</strong> on the map to add point. Press{" "}
        <strong className="font-bold">ESC</strong> to cancel.
      </>
    ),
    active: (
      <>
        Click to add points, then <strong className="font-bold">double-click</strong> or press{" "}
        <strong className="font-bold">Enter</strong> to finish drawing.
      </>
    ),
    complete: (
      <>
        Great! To <strong className="font-bold">edit the shape</strong>,{" "}
        <strong className="font-bold">click</strong> on it to enable edit mode.
      </>
    ),
    cancel: null,
  },
  polyline: {
    start: (
      <>
        To get started, <strong className="font-bold">click</strong> on the map to add point. Press{" "}
        <strong className="font-bold">ESC</strong> to cancel.
      </>
    ),
    active: (
      <>
        Click to add points, then <strong className="font-bold">double-click</strong> or press{" "}
        <strong className="font-bold">Enter</strong> to finish drawing.
      </>
    ),
    complete: (
      <>
        Great! To <strong className="font-bold">edit the shape</strong>,{" "}
        <strong className="font-bold">click</strong> on it to enable edit mode.
      </>
    ),
    cancel: null,
  },
  point: {
    start: (
      <>
        To get started, <strong className="font-bold">click</strong> on the map to add point. Press{" "}
        <strong className="font-bold">ESC</strong> to cancel.
      </>
    ),
    active: (
      <>
        To get started, <strong className="font-bold">click</strong> on the map to add point. Press{" "}
        <strong className="font-bold">ESC</strong> to cancel.
      </>
    ),
    complete: (
      <>
        Great! To <strong className="font-bold">move the point</strong>, just{" "}
        <strong className="font-bold">click</strong> on it and drag it to a new location.
      </>
    ),
    cancel: null,
  },
} as const;

const UPDATE_MESSAGES = {
  polygon: {
    start: (
      <>
        Use the <strong className="font-bold">handles</strong> to edit the polygon - move (drag a
        handle), add (left-click on a white handle), or remove (right-click on a handle) points as
        needed. You can press <strong className="font-bold">ESC</strong> to confirm.
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
        Use the <strong className="font-bold">handles</strong> to edit the polygon - move (drag a
        handle), add (left-click on a white handle), or remove (right-click on a handle) points as
        needed. You can press <strong className="font-bold">ESC</strong> to confirm.
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
        to confirm.
      </>
    ),
    active: (
      <>
        <strong className="font-bold">Click</strong> outside the point or press{" "}
        <strong className="font-bold">ESC</strong> to confirm the new position.
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
    <div className="pointer-events-none absolute left-0 top-4 z-10 w-full duration-300 animate-in fade-in-0 lg:top-10">
      <div className="container">
        <div className="grid grid-cols-12">
          <div className="col-span-10 lg:col-span-5 lg:col-start-8">
            <div className="flex justify-center">
              <div className="rounded bg-white p-2 shadow-md">
                <p className="text-2xs font-light text-foreground lg:text-center lg:text-sm">
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
