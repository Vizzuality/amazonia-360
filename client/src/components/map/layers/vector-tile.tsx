"use client";

import { useEffect } from "react";

import ArcGISVectorTileLayer from "@arcgis/core/layers/VectorTileLayer";

import { useMap } from "@/components/map/provider";

export default function VectorTileLayer({
  layer,
  index,
}: {
  layer: ArcGISVectorTileLayer;
  index: number;
}) {
  const mapInstance = useMap();
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
    map.reorder(layer, index);
  }, [id, index, layer, mapInstance]);

  return null;
}
