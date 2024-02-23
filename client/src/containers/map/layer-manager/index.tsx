"use client";

import { useSyncLayers } from "@/app/store";

import { LAYERS } from "@/constants/layers";

import Layer from "@/components/map/layers";

export default function LayerManager() {
  const [layers] = useSyncLayers();

  return (
    <>
      {layers.map((layer, i) => {
        const l = LAYERS.find((l) => l.id === layer);

        if (!l) {
          return null;
        }

        return <Layer key={l.id} {...l} index={i} />;
      })}
    </>
  );
}
