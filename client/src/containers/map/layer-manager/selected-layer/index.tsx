import { useEffect, useRef } from "react";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

import { useGetFeaturesId } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

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

  const { data: data1 } = useGetFeaturesId(
    {
      id: location?.type === "feature" ? location.FID : null,
      query:
        location?.type === "feature"
          ? DATASETS[`${location?.SOURCE}`].getFeatures({
              returnGeometry: true,
            })
          : undefined,
      feature:
        location?.type === "feature"
          ? DATASETS[`${location?.SOURCE}`].layer
          : undefined,
    },
    {
      enabled:
        location?.type === "feature" &&
        !!DATASETS[`${location?.SOURCE}`].getFeatures &&
        !!location.FID,
      select: (data) => data.features,
    },
  );

  useEffect(() => {
    if (data1) {
      graphicsLayerRef.current.removeAll();
      graphicsLayerRef.current.addMany(
        data1.map((f) => {
          f.symbol = symbol;

          return f;
        }),
      );
    }
  }, [data1]);

  return <Layer index={100} layer={graphicsLayerRef.current} />;
}
