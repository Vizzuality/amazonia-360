import { useSyncGridDatasets } from "@/app/store";

export function GridCounterIndicators({
  total,
  datasetsIds,
}: {
  total: number;
  datasetsIds: string[];
}) {
  const [gridDatasets] = useSyncGridDatasets();

  const activeFiltersPerTopic = gridDatasets?.filter((d) => datasetsIds.includes(d));

  return (
    <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
      {activeFiltersPerTopic?.length} / {total}
    </span>
  );
}
