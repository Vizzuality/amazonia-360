import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import { useLocation } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS, DatasetIds } from "@/constants/datasets";

export default function Test({ id }: { id: DatasetIds }) {
  const [location] = useSyncLocation();
  const features = useLocation(location);

  const { data } = useGetFeatures(
    {
      query: DATASETS[`${id}`].getFeatures({
        ...(!!features.length && {
          geometry: geometryEngine.union(features.map((f) => f.geometry)),
        }),
      }),
      feature: DATASETS[`${id}`].layer,
    },
    {
      enabled: !!DATASETS[`${id}`].getFeatures && !!features.length,
    },
  );

  return (
    <div className="w-full">
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
  );
}
