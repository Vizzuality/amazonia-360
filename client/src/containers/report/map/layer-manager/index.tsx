"use client";

// import { useGetFeatures } from "@/lib/query";

import { useAtomValue } from "jotai";

import { tabAtom } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import GridLayer from "@/containers/report/map/layer-manager/grid-layer";
import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import Layer from "@/components/map/layers";

export default function LayerManager() {
  const tab = useAtomValue(tabAtom);

  return (
    <>
      <Layer index={0} layer={DATASETS.area_afp.layer} />
      <SelectedLayer />

      {tab === "grid" && <GridLayer />}
    </>
  );
}
