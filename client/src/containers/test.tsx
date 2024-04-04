"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";

import { useLocationGeometry } from "@/lib/location";
import { useGetAnalysis, useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import Card from "@/containers/card";
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
          returnGeometry: true,
        }),
      }),
      feature: DATASETS[`${id}`].layer,
    },
    {
      enabled: !!DATASETS[`${id}`].getFeatures && !!GEOMETRY,
    },
  );
  // const q = DATASETS[`${id}`].getFeatures({
  //   ...(!!GEOMETRY && {
  //     geometry: GEOMETRY,
  //   }),
  // });

  // console.log(q?.toJSON());

  const { data: analysis } = useGetAnalysis(
    {
      in_feature1: {
        url: "https://atlas.iadb.org/server/rest/services/Hosted/AFP_AdminLevel2/FeatureServer/0",
      },
      in_feature2: {
        geometryType: "esriGeometryPolygon",
        spatialReference: {
          wkid: 102100,
          latestWkid: 3857,
        },
        features: [
          {
            geometry: GEOMETRY?.toJSON(),
          },
        ],
      },
    },
    {
      enabled: !!data && !!GEOMETRY,
    },
  );

  if (analysis?.results[0]?.value?.features) {
    console.log(analysis?.results[0]?.value?.features);
  }

  const LAYER = useMemo(() => {
    const l = DATASETS[id].layer.clone();
    if (GEOMETRY) {
      l.featureEffect = new FeatureEffect({
        filter: {
          geometry: GEOMETRY,
        },
        excludedEffect: "opacity(0%)",
      });
    }

    return l;
  }, [id, GEOMETRY]);

  return (
    <div className="w-full container grid grid-cols-12">
      <div className="col-span-6">
        <h1>{DATASETS[`${id}`].layer.title}</h1>
        <h2>{data?.features.length}</h2>
        {data?.features.map((f) => (
          <div key={f.attributes.FID}>
            <h3>{f.attributes.FID}</h3>
            <pre className="w-full overflow-scroll break-words">
              {JSON.stringify(f.attributes, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <div className="col-span-6">
        <Card padding={false} className="h-96">
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
        </Card>
      </div>
    </div>
  );
}
