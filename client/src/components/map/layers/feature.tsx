"use client";

import { useEffect } from "react";

import ArcGISFeatureLayer from "@arcgis/core/layers/FeatureLayer";

import { useMap } from "@/components/map/provider";

export default function FeatureLayer({
  layer,
  index,
}: {
  layer: ArcGISFeatureLayer;
  index: number;
}) {
  const mapInstance = useMap();
  const { id, url } = layer;

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
  }, [id, url, mapInstance]);

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
