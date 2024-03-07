"use client";

import { useSyncDatasets } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import SelectedLayer from "@/containers/map/layer-manager/selected-layer";

import Layer from "@/components/map/layers";

export default function LayerManager() {
  const [layers] = useSyncDatasets();

  return (
    <>
      {layers.map((layer, i) => {
        const l = DATASETS[layer].layer;

        if (!l) {
          return null;
        }

        return <Layer key={l.id} layer={l} index={i} />;
      })}

      <SelectedLayer />
    </>
  );
}
