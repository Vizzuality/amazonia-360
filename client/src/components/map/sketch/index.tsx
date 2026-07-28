"use client";

import { useCallback, useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { useLocation } from "@/lib/location";

import { Location } from "@/app/(frontend)/parsers";

import {
  BUFFER_SYMBOL,
  BUFFERS,
  POINT_SYMBOL,
  POLYGON_SYMBOL,
  POLYLINE_SYMBOL,
  SYMBOLS,
} from "@/constants/map";

import { useMap } from "@/components/map/provider";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export type SketchProps = {
  type?: "point" | "polygon" | "polyline";
  enabled?: "create" | "edit";
  updatable?: boolean;
  completed?: boolean;
  location?: Location | null;
  onCreate?: (graphic: __esri.Graphic) => void;
  onCreateChange?: (e: __esri.SketchViewModelCreateEvent) => void;
  onCancel?: () => void;
  onUpdate?: (graphic: __esri.Graphic) => void;
  onUpdateChange?: (e: __esri.SketchViewModelUpdateEvent) => void;
};

export default function Sketch({
  type,
  enabled,
  completed = false,
  updatable = true,
  location,
  onCreate,
  onCreateChange,
  onCancel,
  onUpdate,
  onUpdateChange,
}: SketchProps) {
  const mapInstance = useMap();

  const LOCATION = useLocation(location);

  const layerRef = useRef<__esri.GraphicsLayer>(new GraphicsLayer());
  const bufferRef = useRef<__esri.GraphicsLayer>(new GraphicsLayer());
  const sketchViewModelRef = useRef<SketchViewModel | null>(null);
  const sketchViewModelOnCreateRef = useRef<IHandle | null>(null);
  const sketchViewModelOnUpdateRef = useRef<IHandle | null>(null);
  const bufferDrawTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Monotonic token so a slow/stale async buffer can't overwrite a newer one.
  const bufferDrawTokenRef = useRef(0);

  const drawBuffer = useCallback(
    async (l: __esri.Graphic) => {
      if (!l?.geometry) return;

      const token = ++bufferDrawTokenRef.current;

      const buffer = new Graphic({
        symbol: BUFFER_SYMBOL,
      });

      if (l.geometry.type === "point" || l.geometry.type === "polyline") {
        const b =
          location?.type !== "search"
            ? location?.buffer || BUFFERS[l.geometry.type]
            : BUFFERS[l.geometry.type];
        // Async/off-thread: buffering a long polyline densifies into thousands of
        // vertices and blocks the main thread when done synchronously.
        try {
          const g = await geometryEngineAsync.geodesicBuffer(l.geometry, b, "kilometers");
          buffer.geometry = Array.isArray(g) ? g[0] : g;
        } catch {
          // Worker error/cancel: keep the current buffer instead of clearing it.
          return;
        }
      }

      // A newer draw started while we awaited — let it win, don't clobber.
      if (token !== bufferDrawTokenRef.current) return;

      // Clear the previous buffer only once the new one is ready, to avoid flicker.
      bufferRef.current.removeAll();
      if (buffer.geometry) {
        bufferRef.current.add(buffer);
      }
    },
    [location],
  );

  const handleSketchCreate = useCallback(
    (e: __esri.SketchViewModelCreateEvent) => {
      if (onCreateChange) onCreateChange(e);

      if (e.state === "complete" && sketchViewModelRef.current) {
        if (e.graphic.geometry) {
          const g = e.graphic.clone();

          if (type !== undefined) {
            g.symbol = sketchViewModelRef.current[`${type}Symbol`].clone();
          }

          if (onCreate) onCreate(g);
        } else {
          if (onCancel) onCancel();
        }
      }

      if (e.state === "cancel") {
        if (onCancel) onCancel();
      }
    },
    [type, onCreate, onCreateChange, onCancel],
  );

  const handleSketchUpdate = useCallback(
    (e: __esri.SketchViewModelUpdateEvent) => {
      if (onUpdateChange) onUpdateChange(e);

      if (e.state === "active") {
        // Reshape fires "active" on every pointer move; debounce so we don't queue a
        // buffer computation per move when dragging a long polyline.
        const graphic = e.graphics[0].clone();
        if (bufferDrawTimeoutRef.current) {
          clearTimeout(bufferDrawTimeoutRef.current);
        }
        bufferDrawTimeoutRef.current = setTimeout(() => {
          drawBuffer(graphic);
        }, 150);
      }

      if (e.state === "complete" && e.graphics.length) {
        const updatedGraphic = e.graphics[0].clone();
        if (onUpdate) onUpdate(updatedGraphic);
      }
    },
    [onUpdate, onUpdateChange, drawBuffer],
  );

  const handleListeners = useCallback(() => {
    if (sketchViewModelRef.current) {
      // Remove old listeners
      sketchViewModelOnCreateRef.current?.remove();
      sketchViewModelOnUpdateRef.current?.remove();

      // Add new event listeners
      sketchViewModelOnCreateRef.current = sketchViewModelRef.current.on(
        "create",
        handleSketchCreate,
      );
      sketchViewModelOnUpdateRef.current = sketchViewModelRef.current.on(
        "update",
        handleSketchUpdate,
      );
    }
  }, [handleSketchCreate, handleSketchUpdate]);

  // Initialize the sketch view model
  useEffect(() => {
    if (!mapInstance) return;

    const { view } = mapInstance;
    if (!view) return;

    const sketchViewModel = new SketchViewModel({
      view,
      layer: layerRef.current,
      pointSymbol: POINT_SYMBOL,
      polylineSymbol: POLYLINE_SYMBOL,
      polygonSymbol: POLYGON_SYMBOL,
      defaultCreateOptions: {
        hasZ: false,
        mode: "click",
      },
      defaultUpdateOptions: {
        tool: "reshape",
        enableRotation: false,
        toggleToolOnClick: false,
      },
      updateOnGraphicClick: false,
      // tooltipOptions: {
      //   enabled: true,
      //   visibleElements: {
      //     distance: false,
      //     helpMessage: true,
      //     size: true,
      //     coordinates: false,
      //     area: true,
      //   },
      // },
    });

    sketchViewModelRef.current = sketchViewModel;

    return () => {
      sketchViewModel.destroy();
    };
  }, [mapInstance]);

  // Handle enabling/disabling sketch mode and setting up listeners
  useEffect(() => {
    if (!sketchViewModelRef.current || !mapInstance?.view) return;

    if (!type) {
      sketchViewModelRef.current.cancel();
      return;
    }

    // Reset layer and cancel any ongoing operations
    layerRef.current.removeAll();
    bufferRef.current.removeAll();

    sketchViewModelRef.current.cancel();

    // Enable create mode
    sketchViewModelRef.current.create(type);

    // Remove old listeners
    handleListeners();
  }, [mapInstance, type, enabled, handleListeners]);

  useEffect(() => {
    layerRef.current.removeAll();

    if (LOCATION) {
      const L = LOCATION.clone();
      if (L.geometry) {
        L.symbol = SYMBOLS[L.geometry.type];
        layerRef.current.add(L);

        // drawBuffer owns the buffer layer: it clears the old graphic only once the
        // new (async) buffer is ready, so the buffer never blinks out mid-recompute.
        drawBuffer(L);
      }
    } else {
      // Nothing to draw — clear any leftover buffer.
      bufferRef.current.removeAll();
    }

    handleListeners();
  }, [enabled, location, updatable, LOCATION, drawBuffer, handleListeners]);

  useEffect(() => {
    if (completed) {
      sketchViewModelRef.current?.complete();
    }
  }, [completed]);

  useEffect(() => {
    if (enabled === "edit") {
      sketchViewModelRef.current?.update(layerRef.current.graphics.toArray());
    }
  }, [layerRef, enabled]);

  useEffect(() => {
    return () => {
      if (bufferDrawTimeoutRef.current) {
        clearTimeout(bufferDrawTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <Layer layer={bufferRef.current} index={99} />
      <Layer layer={layerRef.current} index={100} />
    </>
  );
}
