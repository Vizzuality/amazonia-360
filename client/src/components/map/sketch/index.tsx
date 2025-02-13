"use client";

import { useCallback, useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { useLocation } from "@/lib/location";

import { Location } from "@/app/parsers";

import { POINT_SYMBOL, POLYGON_SYMBOL, POLYLINE_SYMBOL } from "@/constants/map";

import { useMap } from "@/components/map/provider";

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
      if (e.state === "start" && e.graphics.length) {
        e.graphics.forEach((graphic) => {
          if (graphic.geometry.type === "polygon") {
            graphic.symbol = POLYGON_SYMBOL;
          }

          if (graphic.geometry.type === "polyline") {
            graphic.symbol = POLYLINE_SYMBOL;
          }

          if (graphic.geometry.type === "point") {
            graphic.symbol = POINT_SYMBOL;
          }
        });
      }

      if (e.state === "complete" && e.graphics.length) {
        e.graphics.forEach((graphic) => {
          if (graphic.geometry.type === "polygon") {
            graphic.symbol = {
              type: "simple-fill",
              color: "#009ADE33",
              outline: {
                type: "simple-line",
                color: "#196E8C",
                width: 1,
                style: "solid",
              },
            } as unknown as __esri.SimpleFillSymbol;
          }
        });
        const updatedGraphic = e.graphics[0].clone();
        if (onUpdate) onUpdate(updatedGraphic);
      }
    },
    [onUpdate],
  );

  // Initialize the sketch view model
  useEffect(() => {
    if (!mapInstance) return;

    const { view } = mapInstance;
    if (!view) return;

    const sketchLayer = layerRef.current;

    const sketchViewModel = new SketchViewModel({
      view,
      layer: sketchLayer,
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

    if (LOCATION) {
      if (LOCATION.geometry.type === "polygon") {
        LOCATION.symbol = POLYGON_SYMBOL;
      }

      if (LOCATION.geometry.type === "polyline") {
        LOCATION.symbol = POLYLINE_SYMBOL;
      }

      if (LOCATION.geometry.type === "point") {
        LOCATION.symbol = POINT_SYMBOL;
      }
      layerRef.current.add(LOCATION);
    }
  }, [location, LOCATION]);


  return <Layer layer={layerRef.current} index={100} />;
}
