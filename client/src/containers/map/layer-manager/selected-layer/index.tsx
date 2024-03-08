import { useEffect, useRef } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

import { useLocation } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import Layer from "@/components/map/layers/graphics";

const symbol = new SimpleFillSymbol({
  color: [0, 0, 0, 0],
  style: "solid",
  outline: {
    width: 1,
    color: "#004E70",
  },
});

export default function SelectedLayer() {
  const graphicsLayerRef = useRef<GraphicsLayer>(
    new GraphicsLayer({
      id: "selected-layer",
    }),
  );
  const [location] = useSyncLocation();

  const graphic = useLocation(location);

  useEffect(() => {
    if (graphic) {
      if (graphic.geometry.type === "point") {
        const g = geometryEngine.geodesicBuffer(
          graphic.geometry,
          30,
          "kilometers",
        );

        graphic.geometry = Array.isArray(g) ? g[0] : g;
      }
      graphic.symbol = symbol;
      graphicsLayerRef.current.removeAll();
      graphicsLayerRef.current.add(graphic);
    }
  }, [graphic]);

  return <Layer index={100} layer={graphicsLayerRef.current} />;
}
