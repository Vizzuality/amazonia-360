"use client";

import dynamic from "next/dynamic";

import { useSyncGridDatasets, useSyncGridSelectedDataset } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import GridLayer from "@/containers/report/map/layer-manager/grid-layer";
import PlaceholderGridLayer from "@/containers/report/map/layer-manager/placeholder-grid-layer";

import { LayerProps } from "@/components/map/layers/types";

import { usePathname } from "@/i18n/navigation";
// import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export default function LayerManager() {
  // const [location] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();

  const pathname = usePathname();

  return (
    <>
      <Layer index={0} layer={DATASETS.area_afp.layer as LayerProps} />
      {/* <SelectedLayer location={location} /> */}

      {pathname.includes("/grid") && !!gridDatasets.length && <GridLayer />}
      {pathname.includes("/grid") &&
        (!gridDatasets.length || (!!gridDatasets.length && gridSelectedDataset === "no-layer")) && (
          <PlaceholderGridLayer />
        )}
    </>
  );
}
