import { useCallback, useEffect, useRef } from "react";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import Layer from "@/components/map/layers/graphics";
import { useMap } from "@/components/map/provider";

export type SketchProps = {
  type?: "point" | "polygon" | "polyline";
  enabled?: boolean;
  onCreate?: (graphic: __esri.Graphic) => void;
  onCancel?: () => void;
};

export default function Sketch({
  type,
  enabled,
  onCreate,
  onCancel,
}: SketchProps) {
  const mapInstance = useMap();

  const layerRef = useRef<__esri.GraphicsLayer>(new GraphicsLayer());

  const sketchViewModelRef = useRef<SketchViewModel>();
  const sketchViewModelOnCreateRef = useRef<IHandle>();

  const handleSketchCreate = useCallback(
    (e: __esri.SketchViewModelCreateEvent) => {
      if (e.state === "complete" && sketchViewModelRef.current) {
        const g = e.graphic.clone();

        if (type !== undefined) {
          g.symbol = sketchViewModelRef.current[`${type}Symbol`].clone();
        }
        // layerRef.current.add(g);

        if (onCreate) onCreate(g);
      }

      if (e.state === "cancel") {
        if (onCancel) onCancel();
      }
    },
    [type, onCreate, onCancel],
  );

  // Create the sketch view model
  useEffect(() => {
    if (!mapInstance) return;

    const { view } = mapInstance;
    if (!view) return;

    const sketchLayer = new GraphicsLayer();

    const sketchViewModel = new SketchViewModel({
      view,
      layer: sketchLayer,
      pointSymbol: new SimpleMarkerSymbol({
        color: "#009ADE11",
        style: "circle",
        size: 10,
        outline: {
          color: "#004E70",
          width: 2,
        },
      }),
      polylineSymbol: new SimpleLineSymbol({
        color: "#009ADE11",
        width: 2,
      }),
      polygonSymbol: new SimpleFillSymbol({
        color: "#009ADE11",
        outline: {
          color: "#004E70",
          width: 2,
        },
      }),
      defaultCreateOptions: {
        hasZ: false,
      },
    });

    sketchViewModelRef.current = sketchViewModel;

    return () => {
      sketchViewModel.destroy();
    };
  }, [mapInstance]);

  // Enable/disable the sketch view model
  useEffect(() => {
    if (!sketchViewModelRef.current) {
      return;
    }

    if (!type) {
      return;
    }

    // reset
    layerRef.current.removeAll();

    // sketchViewModelRef.current.cancel();
    sketchViewModelRef.current.create(type);

    // Check if the sketch view model has the create event listener and remove it
    sketchViewModelOnCreateRef.current?.remove();
    sketchViewModelOnCreateRef.current = sketchViewModelRef.current.on(
      "create",
      handleSketchCreate,
    );
  }, [type, enabled, handleSketchCreate]);

  return <Layer layer={layerRef.current} index={100} />;
}
