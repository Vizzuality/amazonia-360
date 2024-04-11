"use client";

import { useEffect } from "react";

import ArcGISWebTileLayer from "@arcgis/core/layers/WebTileLayer";

import { useMap } from "@/components/map/provider";

export default function ImageryLayer({
  layer,
  index,
}: {
  layer: ArcGISWebTileLayer;
  index: number;
}) {
  const mapInstance = useMap();
  const { id, urlTemplate } = layer;

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
  }, [id, urlTemplate, mapInstance]);

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
