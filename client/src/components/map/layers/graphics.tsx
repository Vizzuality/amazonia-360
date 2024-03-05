"use client";

import { useEffect } from "react";

import ArcGISGraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { useMap } from "@/components/map/provider";

export default function Layer({
  layer,
  index,
}: {
  layer: ArcGISGraphicsLayer;
  index: number;
}) {
  const mapInstance = useMap("default");
  const { id } = layer;

  useEffect(() => {
    return () => {
      if (!mapInstance) {
        return;
      }

      const { map } = mapInstance;

      if (!map) {
        return;
      }

      if (map.findLayerById(id)) {
        const l = map.findLayerById(id);
        map.remove(l);
      }
    };
  }, [id, mapInstance]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const { map } = mapInstance;

    if (!map) {
      return;
    }

    if (!map.findLayerById(id)) {
      map.add(layer, index);
    }
  }, [id, index, layer, mapInstance]);

  return null;
}
