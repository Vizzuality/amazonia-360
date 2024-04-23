"use client";

// import { useGetFeatures } from "@/lib/query";

import { DATASETS } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import FeatureLayer from "@/components/map/layers/feature";

export default function LayerManager() {
  // const { data } = useGetFeatures({
  //   query: DATASETS.biomas.getFeatures(),
  //   feature: DATASETS.biomas.layer,
  // });

  // console.log(data?.features.map((f) => f.attributes));

  return (
    <>
      <FeatureLayer index={0} layer={DATASETS.area_afp.layer} />

      {/* <FeatureLayer index={1} layer={DATASETS.biomas.layer} /> */}

      <SelectedLayer />
    </>
  );
}
