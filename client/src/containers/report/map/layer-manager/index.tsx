"use client";

// import { useGetFeatures } from "@/lib/query";
import dynamic from "next/dynamic";

import { useAtomValue } from "jotai";

import { tabAtom } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import GridLayer from "@/containers/report/map/layer-manager/grid-layer";
import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

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
