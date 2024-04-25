"use client";

// import { useGetFeatures } from "@/lib/query";

import { DATASETS } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import FeatureLayer from "@/components/map/layers/feature";

export default function LayerManager() {
  // const { data } = useGetFeatures(
  //   {
  //     query: DATASETS.acu_knowledge.getFeatures(),
  //     feature: DATASETS.acu_knowledge.layer,
  //   },
  //   {
  //     select(data) {
  //       return data.features.map((f) => f.attributes);
  //     },
  //   },
  // );

  // console.log(data);

  return (
    <>
      <FeatureLayer index={0} layer={DATASETS.area_afp.layer} />

      {/* <FeatureLayer index={1} layer={DATASETS.acu_knowledge.layer} /> */}

      <SelectedLayer />
    </>
  );
}
