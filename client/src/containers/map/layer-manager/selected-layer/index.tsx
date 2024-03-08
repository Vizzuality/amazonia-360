import { useEffect, useRef } from "react";

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

  const graphics = useLocation(location);

  useEffect(() => {
    if (graphics) {
      graphicsLayerRef.current.removeAll();
      graphicsLayerRef.current.addMany(
        graphics.map((f) => {
          f.symbol = symbol;

          return f;
        }),
      );
    }
  }, [graphics]);

  return <Layer index={100} layer={graphicsLayerRef.current} />;
}
