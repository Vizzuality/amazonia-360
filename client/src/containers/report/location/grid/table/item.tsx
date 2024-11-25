import { useMemo } from "react";

import { useGetGridMeta } from "@/lib/grid";

import { useSyncGridDatasets } from "@/app/store";

import { HexagonIcon } from "@/components/ui/icons/hexagon";

export const GridTableItem = (
  props: Record<string, string | number> & { id: number; cell: string },
) => {
  const queryMeta = useGetGridMeta();
  const [gridDatasets] = useSyncGridDatasets();

  const { id, cell, ...rest } = props;

  const ITEMS = useMemo(() => {
    return gridDatasets.map((dataset) => {
      const d = queryMeta.data?.datasets.find((d) => d.var_name === dataset);
      if (!d) return null;

      return {
        name: d.label,
        value: rest[dataset],
      };
    });
  }, [gridDatasets, queryMeta.data?.datasets, rest]);

  const handleClick = () => {
    console.log("Clicked on", id + 1, cell);
  };

  return (
    <div className="flex items-start gap-2 py-2">
      <button
        className="flex min-w-16 shrink-0 items-center gap-2 rounded-sm bg-cyan-100 px-2 py-1"
        onClick={handleClick}
      >
        <HexagonIcon className="h-4 w-4" />
        <span className="text-sm font-semibold">{id + 1}º</span>
      </button>

      <ul className="grow">
        {ITEMS.map((dataset) => (
          <li key={dataset?.name} className="flex justify-between">
            <span>{dataset?.name}</span>
            <span>{dataset?.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GridTableItem;
