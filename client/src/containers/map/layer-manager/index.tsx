"use client";

import { useSyncDatasets } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import Layer from "@/components/map/layers";

export default function LayerManager() {
  const [layers] = useSyncDatasets();

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
    </>
  );
}
