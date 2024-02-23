"use client";

import { useEffect } from "react";

import ArcGISFeatureLayer from "@arcgis/core/layers/FeatureLayer";

import { env } from "@/env.mjs";

import { useMap } from "@/components/map/provider";

export default function Layer(
  props: Partial<ArcGISFeatureLayer> & { id: string },
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

    const { id } = props;

    if (map.findLayerById(id)) {
      const l = map.findLayerById(id);
      Object.entries(props).forEach(([key, value]) => {
        l.set(key, value);
      });
    }

    if (!map.findLayerById(id)) {
      const fl = new ArcGISFeatureLayer({
        ...props,
        apiKey: env.NEXT_PUBLIC_ARCGIS_API_KEY,
      });

      map.add(fl);
    }
  }, [props, mapInstance]);

  return null;
}
