"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import FeatureFilter from "@arcgis/core/webdoc/geotriggersInfo/FeatureFilter";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import SelectedLayer from "@/containers/report/map/layer-manager/selected-layer";

import Layer from "@/components/map/layers";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

export default function Test({ id }: { id: DatasetIds }) {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const { data } = useGetFeatures(
    {
      query: DATASETS[`${id}`].getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS[`${id}`].layer,
    },
    {
      enabled: !!DATASETS[`${id}`].getFeatures && !!GEOMETRY,
    },
  );

  const LAYER = useMemo(() => {
    const l = DATASETS[id].layer.clone();
    if (GEOMETRY) {
      l.featureEffect = new FeatureEffect({
        filter: new FeatureFilter({
          geometry: GEOMETRY,
        }),
        excludedEffect: "opacity(0%)",
      });
    }

    return l;
  }, [id, GEOMETRY]);

  return (
    <div className="w-full container grid grid-cols-12">
      <div className="col-span-6">
        <h1>{DATASETS[`${id}`].layer.title}</h1>

        {data?.features.map((f) => (
          <div key={f.attributes.FID}>
            <h2>{f.attributes.FID}</h2>
            <pre className="w-full overflow-scroll break-words">
              {JSON.stringify(f.attributes, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <div className="col-span-6 h-96">
        <Map
          id={id}
          {...(GEOMETRY?.extent && {
            defaultBbox: [
              GEOMETRY?.extent.xmin,
              GEOMETRY?.extent.ymin,
              GEOMETRY?.extent.xmax,
              GEOMETRY?.extent.ymax,
            ],
            bbox: undefined,
          })}
        >
          <Layer layer={LAYER} index={1} />
          <SelectedLayer />
        </Map>
      </div>
    </div>
  );
}
