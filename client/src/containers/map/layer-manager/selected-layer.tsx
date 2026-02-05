"use client";

import { useEffect, useRef } from "react";

import dynamic from "next/dynamic";

import * as geodesicBufferOperator from "@arcgis/core/geometry/operators/geodesicBufferOperator";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { useLocation } from "@/lib/location";

import { Location } from "@/app/(frontend)/parsers";

import { BUFFER_SYMBOL, BUFFERS, SYMBOLS } from "@/constants/map";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

if (!geodesicBufferOperator.isLoaded()) {
  await geodesicBufferOperator.load();
}

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

  const GRAPHIC = useLocation(location);

  useEffect(() => {
    if (GRAPHIC) {
      const graphic = GRAPHIC.clone();
      if (!graphic.geometry) return;
      const buffer = new Graphic({
        symbol: BUFFER_SYMBOL,
      });

      if (graphic.geometry.type === "point" || graphic.geometry.type === "polyline") {
        const b =
          location?.type !== "search"
            ? location?.buffer || BUFFERS[graphic.geometry.type]
            : BUFFERS[graphic.geometry.type];
        const g = geodesicBufferOperator.execute(graphic.geometry, b, { unit: "kilometers" });

        buffer.geometry = Array.isArray(g) ? g[0] : g;
      }

      graphic.symbol = SYMBOLS[graphic.geometry.type];

      graphicsLayerRef.current.removeAll();
      graphicsLayerRef.current.add(graphic);

      if (buffer.geometry) {
        graphicsLayerRef.current.add(buffer);
      }
    }

    if (!GRAPHIC) {
      graphicsLayerRef.current.removeAll();
    }
  }, [location, GRAPHIC]);

  return <Layer index={index} layer={graphicsLayerRef.current} />;
}
