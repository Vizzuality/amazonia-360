import { useGetArcGISQueryFeatures } from "@/lib/query";

import { DATASETS, DatasetIds } from "@/constants/datasets";

export default function Test({ id }: { id: DatasetIds }) {
  const { data } = useGetArcGISQueryFeatures(
    {
      query: DATASETS[`${id}`].getFeatures,
      feature: DATASETS[`${id}`].layer,
    },
    {
      enabled: !!DATASETS[`${id}`].getFeatures,
    },
  );

  return (
    <div className="w-full">
      <h1>{DATASETS[`${id}`].layer.title}</h1>
      {data?.features.map((f) => (
        <div key={f.attributes.OBJECTID}>
          <h2>{f.attributes.OBJECTID}</h2>
          <pre className="w-full overflow-scroll break-words">
            {JSON.stringify(f.attributes, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
