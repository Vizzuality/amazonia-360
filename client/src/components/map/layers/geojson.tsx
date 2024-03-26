"use client";

import { useEffect } from "react";

import ArcGISGeojsonLayer from "@arcgis/core/layers/GeoJSONLayer";

import { useMap } from "@/components/map/provider";

export default function GeojsonLayer({
  layer,
  index,
}: {
  layer: ArcGISGeojsonLayer;
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
  }, [id, index, layer, mapInstance]);

  return null;
}
