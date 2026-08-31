"use client";

import { useCallback, useEffect, useRef } from "react";

import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import PopupTemplate from "@arcgis/core/PopupTemplate";

import { omit } from "@/lib/utils";

import { whenLayerViewSettled } from "@/components/map/layers/layer-view-status";
import { LayerProps } from "@/components/map/layers/types";
import { useMap } from "@/components/map/provider";

export default function Layer({
  layer,
  index,
  GEOMETRY,
}: {
  layer: LayerProps;
  index: number;
  GEOMETRY?: __esri.Polygon | null;
}) {
  const mapInstance = useMap();
  const { id } = layer;

  // Cancels the pending wait when this layer is removed, so an abandoned layer
  // view can't report back into a map that has moved on.
  const settleAbortRef = useRef<AbortController | null>(null);

  const handleLoad = useCallback(
    (l: __esri.Layer) => {
      if (!mapInstance) {
        return;
      }

      const { view, onLayerViewLoading, onLayerViewSettled } = mapInstance;
      if (!view) {
        return;
      }

      if (onLayerViewLoading) onLayerViewLoading(l.id);

      settleAbortRef.current?.abort();
      const controller = new AbortController();
      settleAbortRef.current = controller;

      whenLayerViewSettled(view, l, { signal: controller.signal })
        .then((status) => {
          if (onLayerViewSettled) onLayerViewSettled(l.id, status);
        })
        .catch(() => {
          // Aborted because the layer was removed — nothing to report.
        });
    },
    [mapInstance],
  );

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
        l.popupTemplate = new PopupTemplate(layer.popupTemplate);
      }
      map.add(l, index);

      map.reorder(l, index);

      handleLoad(l);
    }

    if (layer.type === "graphics") {
      const l = layer as unknown as __esri.GraphicsLayer;
      map.add(l, index);

      map.reorder(l, index);

      handleLoad(l);
    }

    if (layer.type === "vector-tile") {
      const l = new VectorTileLayer(omit(layer, ["type"]));
      map.add(l, index);

      map.reorder(l, index);

      handleLoad(l);
    }

    if (layer.type === "web-tile") {
      const l = new WebTileLayer(omit(layer, ["type"]));
      map.add(l, index);

      map.reorder(l, index);

      handleLoad(l);
    }

    if (layer.type === "imagery-tile") {
      const l = new ImageryTileLayer(omit(layer, ["type"]));
      map.add(l, index);

      map.reorder(l, index);

      handleLoad(l);
    }

    if (layer.type === "imagery") {
      const l = new ImageryLayer(omit(layer, ["type"]));
      // const l = new ImageryLayer({
      //   url: "https://landsat2.arcgis.com/arcgis/rest/services/Landsat8_Views/ImageServer",
      //   format: "jpgpng", // server exports in either jpg or png format
      // });
      map.add(l, index);

      map.reorder(l, index);

      handleLoad(l);
    }

    if ("deck" in layer) {
      const l = layer as unknown as __esri.Layer;
      map.add(l, index);

      map.reorder(l, index);
    }
  }, [id, index, layer, mapInstance, handleLoad]);

  // Update opacity
  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const { map } = mapInstance;

    if (!map || !id) {
      return;
    }

    const l = map.findLayerById(id);

    if (l) {
      l.opacity = layer.opacity ?? 1;
    }
  }, [id, layer.opacity, mapInstance]);

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
      settleAbortRef.current?.abort();

      if (!mapInstance) {
        return;
      }

      const { map, onLayerViewRemoved } = mapInstance;

      if (!map || !id) {
        return;
      }

      const l = map.findLayerById(id);
      if (l) {
        map.remove(l);
      }

      if (onLayerViewRemoved) onLayerViewRemoved(id);
    };
  }, [id, mapInstance]);

  return null;
}
