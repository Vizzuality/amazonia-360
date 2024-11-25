import { useMemo } from "react";

import Point from "@arcgis/core/geometry/Point";
import * as projection from "@arcgis/core/geometry/projection";
import { cellToLatLng } from "h3-js";

import { useGetGridMeta } from "@/lib/grid";

import { useSyncGridDatasets, useSyncLocation } from "@/app/store";

import { HexagonIcon } from "@/components/ui/icons/hexagon";

export const GridTableItem = (
  props: Record<string, string | number> & { id: number; cell: string },
) => {
  const [, setLocation] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();

  const queryMeta = useGetGridMeta();

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
    const latLng = cellToLatLng(cell);
    const p = new Point({ x: latLng[1], y: latLng[0], spatialReference: { wkid: 4326 } });
    const projectedGeom = projection.project(p, { wkid: 102100 });
    const g = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

    setLocation({ type: "point", geometry: g.toJSON() });
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
