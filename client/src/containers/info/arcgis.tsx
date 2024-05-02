import parse from "html-react-parser";

import { useGetMetadata } from "@/lib/query";

import { DATASETS, DatasetIds } from "@/constants/datasets";

import { CardLoader } from "@/containers/card";

export default function InfoArcGis({ id }: { id: DatasetIds }) {
  const query = useGetMetadata({
    id,
  });

  const DATASET = DATASETS[id];

  return (
    <div className="space-y-4 pt-4 first:pt-0">
      <h2 className="text-xl">{DATASET?.layer?.title}</h2>
      <CardLoader query={[query]} className="h-40">
        <div className="prose-sm prose-a:underline">
          {parse(query?.data?.metadata || "")}
        </div>
      </CardLoader>
    </div>
  );
}
