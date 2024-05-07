"use client";

import { useEffect } from "react";

import ArcGISFeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";

import { useMap } from "@/components/map/provider";

export default function FeatureLayer({
  layer,
  index,
  GEOMETRY,
}: {
  layer: ArcGISFeatureLayer;
  index: number;
  GEOMETRY?: __esri.Polygon | null;
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

    const { map, view } = mapInstance;

    if (!map) {
      return;
    }

    if (!map.findLayerById(id)) {
      map.add(layer, index);

      view.whenLayerView(layer).then((layerView) => {
        if (!!GEOMETRY) {
          layerView.filter = new FeatureFilter({
            geometry: GEOMETRY,
            spatialRelationship: "intersects",
          });
        }
      });
    }

    map.reorder(layer, index);
  }, [id, GEOMETRY, index, layer, mapInstance]);

  return null;
}
