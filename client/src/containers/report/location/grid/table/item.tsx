import { useMemo } from "react";

import Point from "@arcgis/core/geometry/Point";
import * as projection from "@arcgis/core/geometry/projection";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { cellToLatLng } from "h3-js";
import { useSetAtom } from "jotai";

import { formatNumberUnit } from "@/lib/formats";
import { useGetGridMeta } from "@/lib/grid";
import { useIndicators } from "@/lib/indicators";
import { getGeometryWithBuffer } from "@/lib/location";
import { cn } from "@/lib/utils";

import {
  gridCellHighlightAtom,
  tmpBboxAtom,
  useSyncGridDatasets,
  useSyncLocation,
} from "@/app/store";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const GridTableItem = (
  props: Record<string, string | number> & { id: number; cell: string },
) => {
  const [, setLocation] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();
  const setGridCellHighlight = useSetAtom(gridCellHighlightAtom);
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const { data: dataIndicators } = useIndicators();

  const queryMeta = useGetGridMeta({
    select: (data) =>
      data.datasets
        .map((dataset) => {
          const matchingIndicator = dataIndicators?.find(
            (indicator) =>
              indicator.resource.type === "h3" &&
              indicator.resource.column &&
              indicator.resource.column === dataset.var_name,
          );

          if (!matchingIndicator) return null;

          return {
            ...dataset,
            name: matchingIndicator.name,
            unit: matchingIndicator.unit,
          };
        })
        .filter(Boolean),
  });

  const { id, cell, ...rest } = props;

  const ITEMS = useMemo(() => {
    return gridDatasets.map((dataset) => {
      const d = queryMeta?.data?.find((d) => d?.var_name === dataset);
      if (!d) return null;

      return {
        name: d.label,
        value: rest[dataset],
        unit: d.unit,
        column: d.var_name,
      };
    });
  }, [gridDatasets, queryMeta.data, rest]);

  const handleClick = () => {
    const latLng = cellToLatLng(cell);

    const p = new Point({ x: latLng[1], y: latLng[0], spatialReference: { wkid: 4326 } });
    const projectedGeom = projection.project(p, { wkid: 102100 });
    const g = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

    setLocation({ type: "point", geometry: g.toJSON() });

    const gWithBuffer = getGeometryWithBuffer(g);
    if (gWithBuffer) {
      setTmpBbox(gWithBuffer.extent);
    }
  };

  const handleMouseEnter = () => {
    setGridCellHighlight({ id, index: cell });
  };

  const handleMouseLeave = () => {
    setGridCellHighlight({
      id: null,
      index: undefined,
    });
  };

  return (
    <AlertDialog>
      <Tooltip>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <div
              className="flex w-full items-start gap-2 rounded-lg px-1 py-2 hover:bg-blue-50"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex min-w-16 shrink-0 items-center gap-2 rounded-sm bg-cyan-100 px-2 py-1 hover:bg-cyan-500 hover:text-white">
                <HexagonIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">{id + 1}º</span>
              </button>
              <ul className="w-full overflow-hidden">
                {ITEMS.map((dataset, i) => (
                  <li
                    key={dataset?.column}
                    className="flex w-full items-end justify-between text-sm"
                  >
                    <div className="flex flex-1 items-end overflow-hidden">
                      <span
                        className={cn({
                          "max-w-[250px] flex-shrink-0 break-words text-gray-400": true,
                          "font-normal": i !== 0,
                        })}
                      >
                        {dataset?.name}
                        <span className="flex-grow overflow-hidden whitespace-nowrap font-extralight tracking-[2.5px] text-muted-foreground">
                          {".".repeat(10)}
                        </span>
                      </span>
                    </div>

                    <span className="flex-shrink-0 whitespace-nowrap text-blue-700">
                      {formatNumberUnit(+(dataset?.value ?? 0), `${dataset?.unit}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </TooltipTrigger>
        </AlertDialogTrigger>

        <TooltipPortal>
          <TooltipContent>
            <TooltipArrow />
            <p className="max-w-36 text-center text-sm font-medium">Redefine area</p>
          </TooltipContent>
        </TooltipPortal>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefine area</AlertDialogTitle>
            <AlertDialogDescription>
              By proceeding, the map will center around your selected cell, and the current area
              selection will be redefined. This action will remove your existing selection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleClick}>Redefine</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Tooltip>
    </AlertDialog>
  );
};

export default GridTableItem;
