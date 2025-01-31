"use client";

// import { useGetFeatures } from "@/lib/query";
import dynamic from "next/dynamic";

import { useAtomValue } from "jotai";

import { tabAtom, useSyncGridDatasets, useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import GridLayer from "@/containers/report/map/layer-manager/grid-layer";
import PlaceholderGridLayer from "@/containers/report/map/layer-manager/placeholder-grid-layer";
import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export default function LayerManager() {
  const [location] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();
  const tab = useAtomValue(tabAtom);

  return (
    <>
      <Layer index={0} layer={DATASETS.area_afp.layer} />
      <SelectedLayer location={location} />

      {tab === "grid" && !!gridDatasets.length && <GridLayer />}
      {tab === "grid" && !gridDatasets.length && <PlaceholderGridLayer />}
    </>
  );
}
