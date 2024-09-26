"use client";

import { useEffect, useRef } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { POINT_BUFFER, POLYLINE_BUFFER, useLocation } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import { BUFFER_SYMBOL, SYMBOLS } from "@/constants/map";

import FeatureLayer from "@/components/map/layers/graphics";

export default function SelectedLayer({ index = 100 }: { index?: number }) {
  const graphicsLayerRef = useRef<GraphicsLayer>(
    new GraphicsLayer({
      id: "selected-layer",
    }),
  );
  const [location] = useSyncLocation();

  const graphic = useLocation(location);

  useEffect(() => {
    if (graphic) {
      const buffer = new Graphic({
        symbol: BUFFER_SYMBOL,
      });

      if (graphic.geometry.type === "point" || graphic.geometry.type === "polyline") {
        const k = graphic.geometry.type === "point" ? POINT_BUFFER : POLYLINE_BUFFER;
        const g = geometryEngine.geodesicBuffer(graphic.geometry, k, "kilometers");

        buffer.geometry = Array.isArray(g) ? g[0] : g;
      }

      graphic.symbol = SYMBOLS[graphic.geometry.type];

      graphicsLayerRef.current.removeAll();
      graphicsLayerRef.current.add(graphic);

      if (buffer.geometry) {
        graphicsLayerRef.current.add(buffer);
      }
    }

    if (!graphic) {
      graphicsLayerRef.current.removeAll();
    }
  }, [graphic]);

  return <FeatureLayer index={index} layer={graphicsLayerRef.current} />;
}
