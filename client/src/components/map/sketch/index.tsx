import { useCallback, useEffect, useRef } from "react";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { POINT_SYMBOL, POLYGON_SYMBOL, POLYLINE_SYMBOL } from "@/constants/map";

import Layer from "@/components/map/layers";
import { useMap } from "@/components/map/provider";

export type SketchProps = {
  type?: "point" | "polygon" | "polyline";
  enabled?: boolean;
  onCreate?: (graphic: __esri.Graphic) => void;
  onCancel?: () => void;
};

export default function Sketch({ type, enabled, onCreate, onCancel }: SketchProps) {
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
      pointSymbol: POINT_SYMBOL,
      polylineSymbol: POLYLINE_SYMBOL,
      polygonSymbol: POLYGON_SYMBOL,
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
      sketchViewModelRef.current.cancel();
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
