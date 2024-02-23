"use client";

import { useEffect } from "react";

import ArcGISFeatureLayer from "@arcgis/core/layers/FeatureLayer";

import { env } from "@/env.mjs";

import { useMap } from "@/components/map/provider";

export default function Layer(
  props: Partial<ArcGISFeatureLayer> &
    Required<Pick<ArcGISFeatureLayer, "id" | "url">> & { index: number },
) {
  const mapInstance = useMap("default");
  const { id, url } = props;

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

    const { index, ...fProps } = props;

    if (map.findLayerById(id)) {
      const l = map.findLayerById(id);
      Object.entries(fProps).forEach(([key, value]) => {
        l.set(key, value);
        map.reorder(map.findLayerById(id), index);
      });
    }

    if (!map.findLayerById(id)) {
      const fl = new ArcGISFeatureLayer({
        ...fProps,
        apiKey: env.NEXT_PUBLIC_ARCGIS_API_KEY,
      });

      map.add(fl, index);
    }
  }, [id, props, mapInstance]);

  return null;
}
