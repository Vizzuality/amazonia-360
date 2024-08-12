import parse from "html-react-parser";

import { DATASETS, DatasetIds } from "@/constants/datasets";

export default function InfoRaster({ id }: { id: DatasetIds }) {
  const DATASET = DATASETS[id];

  return (
    <div className="space-y-4 pt-4 first:pt-0">
      <h2 className="text-xl">{DATASET?.layer?.title}</h2>
      <div className="prose-sm prose-a:break-words prose-a:underline">
        {parse(DATASET?.metadata?.data || "")}
      </div>
    </div>
  );
}
