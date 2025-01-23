import { useMemo } from "react";

import Point from "@arcgis/core/geometry/Point";
import * as projection from "@arcgis/core/geometry/projection";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { cellToLatLng } from "h3-js";
import { useAtomValue, useSetAtom } from "jotai";

import {
  useGetGridMeta,
  // useGetGridTable
} from "@/lib/grid";
import {
  getGeometryWithBuffer,
  // useLocationGeometry
} from "@/lib/location";

// import { BodyReadTableGridTablePostFiltersItem } from "@/types/generated/api.schemas";

import {
  popupInfoAtom,
  tmpBboxAtom,
  useSyncGridDatasets,
  useSyncLocation,
  // useSyncGridFilters,
  // useSyncGridFiltersSetUp,
  // useSyncGridSelectedDataset,
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
import { Button } from "@/components/ui/button";
import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// import { useGetGridTile } from "@/types/generated/grid";

// const WEB_MERCATOR = "EPSG:3857";
// const WGS84 = "EPSG:4326";

export const MapPopup = (props: Record<string, string | number> & { cell: string }) => {
  const [, setLocation] = useSyncLocation();
  const popupInfo = useAtomValue(popupInfoAtom);
  // const [gridFilters] = useSyncGridFilters();
  // const [gridFiltersSetUp] = useSyncGridFiltersSetUp();
  // const [gridSelectedDataset] = useSyncGridSelectedDataset();

  const [gridDatasets] = useSyncGridDatasets();

  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const queryMeta = useGetGridMeta();

  // const { data, error, isLoading } = useGetGridTile(popupInfo?.id);

  const { cell, ...rest } = props;

  // const GEOMETRY = useLocationGeometry(location, {
  //   wkid: 4326,
  // });

  // const { data: queryTable } = useGetGridTable(
  //   {
  //     body: {
  //       ...(!!GEOMETRY && {
  //         geojson: {
  //           type: "Feature",
  //           properties: {},
  //           geometry: {
  //             type: "Polygon",
  //             coordinates: GEOMETRY?.toJSON().rings,
  //           },
  //         },
  //       }),
  //       filters: (() => {
  //         if (!gridSelectedDataset) return [];

  //         const datasetMeta = queryMeta.data?.datasets.find(
  //           (d) => d.var_name === gridSelectedDataset,
  //         );

  //         if (!datasetMeta) return [];

  //         if (datasetMeta.var_dtype === "Float64") {
  //           return (gridFilters?.[gridSelectedDataset]?.map((f, i) => ({
  //             filter_type: "numerical",
  //             column_name: gridSelectedDataset,
  //             operation: i === 0 ? "gte" : "lte",
  //             value: f,
  //           })) ?? []) satisfies BodyReadTableGridTablePostFiltersItem[];
  //         }

  //         return [];
  //       })(),
  //     },
  //     params: {
  //       level: 1,
  //       order_by: [`${gridFiltersSetUp?.direction === "asc" ? "" : "-"}${gridSelectedDataset}`],
  //       direction: gridFiltersSetUp?.direction || "asc",
  //       limit: 30,
  //     },
  //   },
  //   {
  //     select: (data) => {
  //       return data?.table.filter((t) => t.column === gridSelectedDataset);
  //     },
  //     enabled: !!gridSelectedDataset,
  //   },
  // );

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

  if (!popupInfo.x || !popupInfo.y || !popupInfo.id) return null;

  return (
    <div
      className="absolute flex flex-col space-y-1.5 rounded-lg bg-white p-4 shadow-md"
      style={{
        ...(popupInfo?.y && { top: popupInfo?.y }),
        ...(popupInfo?.x && { left: popupInfo?.x }),
      }}
    >
      <button className="flex w-fit min-w-16 shrink-0 items-center gap-2 rounded-sm bg-cyan-100 px-2 py-1 hover:bg-cyan-500 hover:text-white">
        <HexagonIcon className="h-4 w-4" />
        <span className="text-sm font-semibold">{popupInfo.id + 1}º</span>
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
