import { useEffect, useRef } from "react";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { useMap } from "@/components/map/provider";

export default function Sketch() {
  const mapInstance = useMap();

  const sketchViewModelRef = useRef<SketchViewModel>();

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const { view } = mapInstance;

    if (!view) {
      return;
    }

    const layer = new GraphicsLayer();
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

    sketchViewModel.on("create", (event) => {
      if (event.state === "complete") {
        const g = event.graphic.clone();

        g.symbol = new SimpleFillSymbol({
          color: "#009ADE11",
          outline: {
            color: "#004E70",
            width: 2,
          },
        });
        layer.add(g);
        mapInstance.map.add(layer, 100);
      }
    });

    sketchViewModel.on("update", (event) => {
      if (event.state === "complete") {
        console.log(event.graphics);
      }
    });

    return () => {
      sketchViewModel.destroy();
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!sketchViewModelRef.current) {
      return;
    }

    sketchViewModelRef.current.create("polygon");
  }, []);

  return null;
}
