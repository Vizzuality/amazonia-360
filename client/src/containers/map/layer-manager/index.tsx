"use client";

import { useMemo } from "react";

import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";

import { useSyncDatasets } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import Layer from "@/components/map/layers";
import GeojsonLayer from "@/components/map/layers/geojson";

import GEOJSON from "@/data/geojson.json";

export default function LayerManager() {
  const [layers] = useSyncDatasets();

  const geojsonLayer = useMemo(() => {
    const blob = new Blob([JSON.stringify(GEOJSON)], {
      type: "application/json",
    });

    return new GeoJSONLayer({
      id: "geojson",
      title: "GeoJSON",
      url: URL.createObjectURL(blob),
    });
  }, []);

  return (
    <>
      {layers.map((layer, i) => {
        const l = DATASETS[layer].layer;
        // l!.opacity = opacity;

        if (!l) {
          return null;
        }

        return <Layer key={l.id} layer={l} index={i} />;
      })}

      <GeojsonLayer layer={geojsonLayer} index={layers.length} />
    </>
  );
}
