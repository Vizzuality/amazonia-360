import { useGetFeatures, useGetFeaturesId } from "@/lib/query";

import { DATASETS, DatasetIds } from "@/constants/datasets";

export default function Test({ id }: { id: DatasetIds }) {
  const { data } = useGetFeatures(
    {
      query: DATASETS[`${id}`].getFeatures(),
      feature: DATASETS[`${id}`].layer,
    },
    {
      enabled: !!DATASETS[`${id}`].getFeatures,
    },
  );

  const { data: data1 } = useGetFeaturesId(
    {
      id: 756,
      query: DATASETS[`${id}`].getFeatures({
        returnGeometry: true,
      }),
      feature: DATASETS[`${id}`].layer,
    },
    {
      enabled: !!DATASETS[`${id}`].getFeatures,
      select: (data) => data.features[0],
    },
  );

  console.info(data1);

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
