"use client";

import { useCallback, useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { POINT_SYMBOL, POLYGON_SYMBOL, POLYLINE_SYMBOL } from "@/constants/map";

import { useMap } from "@/components/map/provider";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export type SketchProps = {
  type?: "point" | "polygon" | "polyline";
  enabled?: boolean;
  onCreate?: (graphic: __esri.Graphic) => void;
  onCancel?: () => void;
  onUpdate?: (graphic: __esri.Graphic) => void;
};

export default function Sketch({ type, enabled, onCreate, onCancel, onUpdate }: SketchProps) {
  const mapInstance = useMap();

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
            graphic.symbol = {
              type: "simple-fill",
              color: "#009ADE33",
              outline: {
                type: "line",
                color: "#196E8C",
                width: 1,
                style: "long-dash",
              },
            } as unknown as __esri.SimpleFillSymbol;

            // graphic.symbol = {
            //   type: POLYGON_SYMBOL.type,
            // } as unknown as __esri.SimpleFillSymbol;
          }

          if (graphic.geometry.type === "polyline") {
            graphic.symbol = {
              type: "simple-line",
              color: "red",
              outline: {
                type: "simple-line",
                color: "#196E8C",
                width: 1,
                style: "long-dash",
              },
            } as unknown as __esri.SimpleLineSymbol;
          }

          if (graphic.geometry.type === "point") {
            graphic.symbol = {
              type: "simple-marker",
              style: "circle",
              color: "#009ADE",
              opacity: 0.5,
              size: "12px",
              outline: {
                type: "simple-line",
                color: "black",
                width: 1,
              },
            } as unknown as __esri.SimpleMarkerSymbol;
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

            // graphic.symbol = {
            //   type: POLYGON_SYMBOL.type,
            // } as unknown as __esri.SimpleFillSymbol;
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
      // tooltipOptions: {
      //   enabled: true,
      //   helpMessage: "Click to start drawing",
      // },
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

  return <Layer layer={layerRef.current} index={100} />;
}
