"use client";

import { useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { POINT_BUFFER, POLYLINE_BUFFER, useLocation } from "@/lib/location";

import { Location } from "@/app/parsers";

import { BUFFER_SYMBOL, SYMBOLS } from "@/constants/map";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export default function SelectedLayer({
  index = 100,
  location,
}: {
  index?: number;
  location: Location | null;
}) {
  const graphicsLayerRef = useRef<GraphicsLayer>(
    new GraphicsLayer({
      id: "selected-layer",
    }),
  );

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

  return <Layer index={index} layer={graphicsLayerRef.current} />;
}
