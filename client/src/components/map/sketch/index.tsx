"use client";

import { useCallback, useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { useLocation } from "@/lib/location";

import { Location } from "@/app/parsers";

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
  enabled?: boolean;
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
  const sketchViewModelRef = useRef<SketchViewModel>();
  const sketchViewModelOnCreateRef = useRef<IHandle>();
  const sketchViewModelOnUpdateRef = useRef<IHandle>();

  // const drawHighlight = useCallback(() => {
  //   // @ts-expect-error - Internal graphics layer
  //   const ig: __esri.GraphicsLayer = sketchViewModelRef?.current?._internalGraphicsLayer; // Internal graphics layer

  //   // console.log(ig.graphics);

  //   ig?.graphics.map((g) => {
  //     if (g.geometry.type === "point") {
  //       if ("pointIndex" in g.attributes) {
  //         g.symbol = POINT_SYMBOL;
  //       }
  //       console.log(g.attributes);
  //     }
  //   });
  // }, []);

  const drawBuffer = useCallback(
    (l: __esri.Graphic) => {
      if (!l) return;

      bufferRef.current.removeAll();

      const buffer = new Graphic({
        symbol: BUFFER_SYMBOL,
      });

      if (l.geometry.type === "point" || l.geometry.type === "polyline") {
        const b =
          location?.type !== "search"
            ? location?.buffer || BUFFERS[l.geometry.type]
            : BUFFERS[l.geometry.type];
        const g = geometryEngine.geodesicBuffer(l.geometry, b, "kilometers");

        buffer.geometry = Array.isArray(g) ? g[0] : g;
      }

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
        const g = e.graphic.clone();

        if (type !== undefined) {
          g.symbol = sketchViewModelRef.current[`${type}Symbol`].clone();
        }

        if (onCreate) onCreate(g);
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
        drawBuffer(e.graphics[0].clone());
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
      },
      defaultUpdateOptions: {
        tool: "reshape",
        enableRotation: false,
        toggleToolOnClick: true,
      },
      updateOnGraphicClick: true,
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
    bufferRef.current.removeAll();

    if (LOCATION) {
      LOCATION.symbol = SYMBOLS[LOCATION.geometry.type];
      layerRef.current.add(LOCATION);

      drawBuffer(LOCATION);
    }

    handleListeners();

    if (sketchViewModelRef.current) {
      const updateOnGraphicClick = location?.type !== "search";
      sketchViewModelRef.current.updateOnGraphicClick = updateOnGraphicClick;
    }
  }, [location, LOCATION, drawBuffer, handleListeners]);

  return (
    <>
      <Layer layer={bufferRef.current} index={99} />
      <Layer layer={layerRef.current} index={100} />
    </>
  );
}
