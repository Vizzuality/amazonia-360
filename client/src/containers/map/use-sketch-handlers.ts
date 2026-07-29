"use client";

import { useCallback, useEffect, useRef } from "react";

import { useAtom, useSetAtom } from "jotai";

import { getGeometryWithBuffer } from "@/lib/location";

import {
  gridHoverAtom,
  sketchActionAtom,
  sketchAtom,
  tmpBboxAtom,
  useSyncLocation,
} from "@/app/(frontend)/store";

import { BUFFERS } from "@/constants/map";

// Sketch/draw flow shared by the map containers (view + edit): create/update/cancel,
// the grid-hover reset, and the edit-focus effect. Extracted so both containers wire
// the same <Sketch> without duplicating the whole handler block.
export function useSketchHandlers() {
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const [sketch, setSketch] = useAtom(sketchAtom);
  const [sketchAction, setSketchAction] = useAtom(sketchActionAtom);
  const sketchActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setGridHover = useSetAtom(gridHoverAtom);
  const [location, setLocation] = useSyncLocation();

  const handleCreate = useCallback(
    async (graphic: __esri.Graphic) => {
      setSketch({ enabled: undefined, type: undefined });

      if (graphic.geometry) {
        setLocation({
          type: graphic.geometry.type,
          geometry: graphic.geometry.toJSON(),
          buffer: BUFFERS[graphic.geometry.type],
        });

        const g = await getGeometryWithBuffer(graphic.geometry, BUFFERS[graphic.geometry.type]);
        if (g?.extent) {
          setTmpBbox(g.extent);
        }
      }

      sketchActionTimeoutRef.current = setTimeout(() => {
        setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
      }, 5000);
    },
    [setTmpBbox, setSketch, setLocation, setSketchAction],
  );

  const handleCreateChange = useCallback(
    (e: __esri.SketchViewModelCreateEvent) => {
      if (sketchActionTimeoutRef.current) {
        clearTimeout(sketchActionTimeoutRef.current);
      }
      setSketchAction({ type: "create", state: e.state, geometryType: sketch.type });
    },
    [setSketchAction, sketch.type],
  );

  const handleCancel = useCallback(() => {
    setSketch({ enabled: undefined, type: undefined });
    setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
  }, [setSketch, setSketchAction]);

  const handleUpdate = useCallback(
    async (graphic: __esri.Graphic) => {
      if (!location || !graphic.geometry) return;
      const b = location.type !== "search" ? location.buffer : BUFFERS[graphic.geometry.type];
      // Update the location state with the updated geometry
      setLocation({
        type: graphic.geometry.type,
        geometry: graphic.geometry.toJSON(),
        buffer: b,
      });

      // Optionally update the bounding box based on the updated geometry
      const g = await getGeometryWithBuffer(graphic.geometry, b);
      if (g?.extent) {
        setTmpBbox(g.extent);
      }

      setSketch({ enabled: undefined, type: undefined });
      setSketchAction({ type: undefined, state: undefined, geometryType: undefined });
    },
    [location, setLocation, setTmpBbox, setSketch, setSketchAction],
  );

  const handleUpdateChange = useCallback(
    (e: __esri.SketchViewModelUpdateEvent) => {
      if (sketchActionTimeoutRef.current) {
        clearTimeout(sketchActionTimeoutRef.current);
      }
      if (!!e.graphics.length && e.graphics[0].geometry) {
        setSketchAction({
          type: "update",
          state: e.state,
          geometryType: e.graphics[0].geometry.type,
        });
      }
    },
    [setSketchAction],
  );

  const handlePointerLeave = useCallback(() => {
    setGridHover({
      id: null,
      cell: undefined,
      index: undefined,
      values: [],
      x: null,
      y: null,
      coordinates: undefined,
    });
  }, [setGridHover]);

  useEffect(() => {
    if (sketch.enabled === "edit") {
      // focus map
      const mapElement = document.querySelector("#map-default .esri-view-surface") as HTMLElement;

      if (mapElement) {
        mapElement.focus();
      }
    }
  }, [sketch.enabled]);

  return {
    sketch,
    setSketch,
    sketchAction,
    setSketchAction,
    location,
    setLocation,
    handleCreate,
    handleCreateChange,
    handleCancel,
    handleUpdate,
    handleUpdateChange,
    handlePointerLeave,
  };
}
