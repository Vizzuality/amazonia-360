import { DATASETS, DatasetIds } from "@/constants/datasets";

export default function InfoRaster({ id }: { id: DatasetIds }) {
  const DATASET = DATASETS[id];

  return (
    <div className="space-y-2">
      <h2>{DATASET?.layer?.title}</h2>

      {/* <div className="prose-sm">{parse(query?.data?.metadata || "")}</div> */}
    </div>
  );
}
