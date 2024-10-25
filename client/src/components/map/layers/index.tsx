"use client";

import { useEffect } from "react";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";

import { useMap } from "@/components/map/provider";

export default function Layer({
  layer,
  index,
  GEOMETRY,
}: {
  layer: FeatureLayer | WebTileLayer | VectorTileLayer | MapImageLayer | GraphicsLayer;
  index: number;
  GEOMETRY?: __esri.Polygon | null;
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

    const { map, view } = mapInstance;

    if (!map) {
      return;
    }

    if (!map.findLayerById(id)) {
      map.add(layer, index);

      if (layer.type === "feature") {
        view.whenLayerView(layer).then((layerView) => {
          if (!!GEOMETRY) {
            layerView.filter = new FeatureFilter({
              geometry: GEOMETRY,
              spatialRelationship: "intersects",
            });
          }
        });
      }
    }

    map.reorder(layer, index);
  }, [id, index, layer, mapInstance, GEOMETRY]);

  return null;
}
