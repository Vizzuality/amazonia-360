"use client";

import { useCallback, useEffect } from "react";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
// import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";

import { omit } from "@/lib/utils";

import { useMap } from "@/components/map/provider";

export default function Layer({
  layer,
  index,
  GEOMETRY,
}: {
  layer:
    | Partial<__esri.WebTileLayer>
    | Partial<__esri.ImageryTileLayer>
    | Partial<__esri.FeatureLayer>
    | Partial<__esri.GraphicsLayer>
    | Partial<__esri.VectorTileLayer>;
  index: number;
  GEOMETRY?: __esri.Polygon | null;
}) {
  const mapInstance = useMap();
  const { id } = layer;

  const addLayer = useCallback(async () => {
    if (!mapInstance) {
      return;
    }

    const { map } = mapInstance;

    if (!map || !id) {
      return;
    }

    if (layer.type === "feature") {
      const l = new FeatureLayer(omit(layer, ["type"]));

      if (layer.popupTemplate) {
        l.popupEnabled = true;
        l.popupTemplate = layer.popupTemplate;
      }
      map.add(l, index);

      map.reorder(l, index);
    }

    if (layer.type === "graphics") {
      map.add(layer as GraphicsLayer, index);

      map.reorder(layer as GraphicsLayer, index);
    }

    if (layer.type === "vector-tile") {
      const l = new VectorTileLayer(omit(layer, ["type"]));
      map.add(l, index);

      map.reorder(l, index);
    }

    if (layer.type === "web-tile") {
      const l = new WebTileLayer(omit(layer, ["type"]));
      map.add(l, index);

      map.reorder(l, index);
    }

    if (layer.type === "imagery-tile") {
      // const l = new ImageryTileLayer(omit(layer, ["type"]));
      const l = new ImageryLayer(omit(layer, ["type"]));
      map.add(l, index);

      map.reorder(l, index);
    }

    if ("deck" in layer) {
      const l = layer as unknown as __esri.Layer;
      map.add(l, index);

      map.reorder(l, index);
    }
  }, [id, index, layer, mapInstance]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const { map } = mapInstance;

    if (!map || !id) {
      return;
    }

    const l = map.findLayerById(id);

    if (!l) {
      addLayer();
    }

    if (l) {
      map.reorder(l, index);
    }
  }, [id, index, layer, mapInstance, GEOMETRY, addLayer]);

  useEffect(() => {
    return () => {
      if (!mapInstance) {
        return;
      }

      const { map } = mapInstance;

      if (!map || !id) {
        return;
      }

      if (map.findLayerById(id)) {
        const l = map.findLayerById(id);
        map.remove(l);
      }
    };
  }, [id, mapInstance]);

  return null;
}
