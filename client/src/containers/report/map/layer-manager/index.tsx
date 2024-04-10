"use client";

import { DATASETS } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import FeatureLayer from "@/components/map/layers/feature";

export default function LayerManager() {
  return (
    <>
      <FeatureLayer index={0} layer={DATASETS.area_afp.layer} />

      <SelectedLayer />
    </>
  );
}
