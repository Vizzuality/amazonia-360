import { useMemo } from "react";

import Point from "@arcgis/core/geometry/Point";
import * as projection from "@arcgis/core/geometry/projection";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { cellToLatLng } from "h3-js";
import { useSetAtom } from "jotai";

import { useGetGridMeta } from "@/lib/grid";
import { getGeometryWithBuffer } from "@/lib/location";

import { tmpBboxAtom, useSyncGridDatasets, useSyncLocation } from "@/app/store";

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
import { Button } from "@/components/ui/button";
import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const MapPopup = (props: Record<string, string | number> & { id: number; cell: string }) => {
  const [, setLocation] = useSyncLocation();

  const [gridDatasets] = useSyncGridDatasets();

  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const queryMeta = useGetGridMeta();

  const { id, cell, ...rest } = props;

  const ITEMS = useMemo(() => {
    return gridDatasets.map((dataset) => {
      const d = queryMeta.data?.datasets.find((d) => d.var_name === dataset);
      if (!d) return null;

      return {
        name: d.label,
        value: rest[dataset],
        unit: d.unit,
      };
    });
  }, [gridDatasets, queryMeta.data?.datasets, rest]);

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

  return (
    <div className="absolute right-4 top-4 flex flex-col space-y-1.5 rounded-lg bg-white p-4 shadow-md">
      <button className="flex w-fit min-w-16 shrink-0 items-center gap-2 rounded-sm bg-cyan-100 px-2 py-1 hover:bg-cyan-500 hover:text-white">
        <HexagonIcon className="h-4 w-4" />
        <span className="text-sm font-semibold">{id + 1}º</span>
      </button>
      <div className="flex flex-col space-y-1">
        {ITEMS.map((item, index) => {
          return (
            <div
              key={index}
              className="flex items-center justify-between space-x-2 text-sm font-medium"
            >
              <span className="text-muted-foreground">{item?.name}</span>
              {item?.value && <span className="text-foreground">{item.value}</span>}
            </div>
          );
        })}
      </div>
      <AlertDialog>
        <Tooltip>
          <AlertDialogTrigger asChild>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Button variant="outline">Redefine area</Button>
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
    </div>
  );
};

export default MapPopup;
