"use client";

import { useCallback, useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { POINT_BUFFER, POLYLINE_BUFFER, useLocation } from "@/lib/location";

import { Location } from "@/app/parsers";

import { BUFFER_SYMBOL, POINT_SYMBOL, POLYGON_SYMBOL, POLYLINE_SYMBOL, SYMBOLS } from "@/constants/map";

import { useMap } from "@/components/map/provider";
import Graphic from "@arcgis/core/Graphic";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export type SketchProps = {
  type?: "point" | "polygon" | "polyline";
  enabled?: boolean;
  location?: Location | null;
  onCreate?: (graphic: __esri.Graphic) => void;
  onCancel?: () => void;
  onUpdate?: (graphic: __esri.Graphic) => void;
};

export default function Sketch({
  type,
  enabled,
  location,
  onCreate,
  onCancel,
  onUpdate,
}: SketchProps) {
  const mapInstance = useMap();

  const LOCATION = useLocation(location);

  const layerRef = useRef<__esri.GraphicsLayer>(new GraphicsLayer());
  const bufferRef = useRef<__esri.GraphicsLayer>(new GraphicsLayer());
  const sketchViewModelRef = useRef<SketchViewModel>();
  const sketchViewModelOnCreateRef = useRef<IHandle>();
  const sketchViewModelOnUpdateRef = useRef<IHandle>();

  const handleSketchCreate = useCallback(
    (e: __esri.SketchViewModelCreateEvent) => {
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
    [type, onCreate, onCancel],
  );

  const handleSketchUpdate = useCallback(
    (e: __esri.SketchViewModelUpdateEvent) => {

      if (e.state === "active") {
        console.log("update", e);
        addBuffer(e.graphics[0].clone());
      }

      if (e.state === "complete" && e.graphics.length) {
        const updatedGraphic = e.graphics[0].clone();
        if (onUpdate) onUpdate(updatedGraphic);
      }
    },
    [onUpdate],
  );

  const addBuffer = useCallback((location: __esri.Graphic) => {
    if (!location) return;

    bufferRef.current.removeAll();

    const buffer = new Graphic({
      symbol: BUFFER_SYMBOL,
    });

    if (location.geometry.type === "point" || location.geometry.type === "polyline") {
      const k = location.geometry.type === "point" ? POINT_BUFFER : POLYLINE_BUFFER;
      const g = geometryEngine.geodesicBuffer(location.geometry, k, "kilometers");

      buffer.geometry = Array.isArray(g) ? g[0] : g;
    }

    if (buffer.geometry) {
      bufferRef.current.add(buffer);
    }
  }, []);

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
    });


    sketchViewModelRef.current = sketchViewModel;

    return () => {
      sketchViewModel.destroy();
    };
  }, [mapInstance]);

  // Handle enabling/disabling sketch mode and setting up listeners
  useEffect(() => {
    if (!sketchViewModelRef.current) return;

    const sketchViewModel = sketchViewModelRef.current;

    if (!type) {
      sketchViewModel.cancel();
      return;
    }

    // Reset layer and cancel any ongoing operations
    layerRef.current.removeAll();
    bufferRef.current.removeAll();

    sketchViewModel.cancel();

    // Enable create mode
    sketchViewModel.create(type);

    // Remove old listeners
    sketchViewModelOnCreateRef.current?.remove();
    sketchViewModelOnUpdateRef.current?.remove();

    // Add new event listeners
    sketchViewModelOnCreateRef.current = sketchViewModel.on("create", handleSketchCreate);
    sketchViewModelOnUpdateRef.current = sketchViewModel.on("update", handleSketchUpdate);
  }, [type, enabled, handleSketchCreate, handleSketchUpdate]);

  useEffect(() => {
    layerRef.current.removeAll();
    bufferRef.current.removeAll();

    if (LOCATION) {
      LOCATION.symbol = SYMBOLS[LOCATION.geometry.type];
      layerRef.current.add(LOCATION);

      addBuffer(LOCATION);
    }
  }, [location, LOCATION, addBuffer]);

  return <>
    <Layer layer={bufferRef.current} index={99} />
    <Layer layer={layerRef.current} index={100} />
  </>;
}
