import { useCallback, useEffect } from "react";

import { useSetAtom } from "jotai";

import { useSyncGridDatasets, selectedFiltersViewAtom } from "@/app/store";

export default function GridClearFilters() {
  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const setSelectedFiltersView = useSetAtom(selectedFiltersViewAtom);

  const handleClick = useCallback(() => {
    setSelectedFiltersView(false);
    setGridDatasets([]);
  }, [setGridDatasets, setSelectedFiltersView]);

  useEffect(() => {
    if (gridDatasets.length === 0) {
      setSelectedFiltersView(false);
    }
  }, [gridDatasets, setSelectedFiltersView]);

  return (
    <button
      type="button"
      disabled={!gridDatasets.length}
      className="cursor-pointer space-x-1 whitespace-nowrap text-end text-xs font-semibold text-primary transition-colors duration-500 ease-linear hover:underline"
      onClick={handleClick}
    >
      <span>Clear selection</span>
      <span>({gridDatasets.length})</span>
    </button>
  );
}
