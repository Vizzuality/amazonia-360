"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import Layer from "@/components/map/layers/graphics";

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

  const gLayer = useMemo(() => {
    const layer = new GraphicsLayer({
      id: `${id}-graphics`,
    });

    if (data) {
      layer.addMany(
        data.features.map((f) => {
          const renderer = DATASETS[`${id}`].layer.renderer as SimpleRenderer;
          // f.symbol = DATASETS[`${id}`].layer.getSymbol(f).symbol;
          f.symbol = renderer.symbol;
          return f;
        }),
      );
    }

    return layer;
  }, [data, id]);

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

      <div className="col-span-6 max-h-96">
        <Map
          id={id}
          {...(GEOMETRY?.extent && {
            defaultBbox: [
              GEOMETRY?.extent.xmin,
              GEOMETRY?.extent.ymin,
              GEOMETRY?.extent.xmax,
              GEOMETRY?.extent.ymax,
            ],
          })}
        >
          <Layer layer={gLayer} index={0} />
        </Map>
      </div>
    </div>
  );
}
