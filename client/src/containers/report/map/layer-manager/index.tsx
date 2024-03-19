"use client";

import { DATASETS } from "@/constants/datasets";

import SelectedLayer from "@/containers/map/layer-manager/selected-layer";

import Layer from "@/components/map/layers";

export default function LayerManager() {
  return (
    <>
      <Layer index={0} layer={DATASETS.area_afp.layer} />

      <SelectedLayer />
    </>
  );
}
