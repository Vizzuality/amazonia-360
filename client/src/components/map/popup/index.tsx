import Point from "@arcgis/core/geometry/Point";
import * as projection from "@arcgis/core/geometry/projection";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtomValue, useSetAtom } from "jotai";

import { formatNumber } from "@/lib/formats";
import { useIndicators } from "@/lib/indicators";
import { getGeometryWithBuffer } from "@/lib/location";

import { Indicator } from "@/app/local-api/indicators/route";
import { popupInfoAtom, tmpBboxAtom, useSyncLocation } from "@/app/store";

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
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type IndicatorData = Indicator & {
  value: string;
  column: string;
};

export const MapPopup = () => {
  const [, setLocation] = useSyncLocation();
  const popupInfo = useAtomValue(popupInfoAtom);
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const { data: dataIndicators } = useIndicators<IndicatorData[]>({
    select: (data) =>
      popupInfo.values
        .map((v) => {
          const match = data.find(
            (i) => i.resource.type === "h3" && v.column === i.resource.column,
          );

          if (match) {
            return {
              name: match.name,
              unit: match.unit,
              ...v,
              value: formatNumber(typeof v.value === "number" ? v.value : undefined),
            };
          }

          return null;
        })
        .filter((item): item is IndicatorData => item !== null),
  });

  const handleClick = () => {
    const p = new Point({
      x: popupInfo.coordinates?.[0],
      y: popupInfo.coordinates?.[1],
      spatialReference: { wkid: 4326 },
    });

    const projectedGeom = projection.project(p, { wkid: 102100 });
    const g = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

    setLocation({ type: "point", geometry: g.toJSON() });

    const gWithBuffer = getGeometryWithBuffer(g);
    if (gWithBuffer) {
      setTmpBbox(gWithBuffer.extent);
    }
  };

  if (!popupInfo.x || !popupInfo.y || !dataIndicators) return null;

  return (
    <div
      className="absolute flex flex-col space-y-1.5 rounded-lg bg-white p-4 shadow-md"
      style={{
        ...(popupInfo?.y && { top: popupInfo?.y }),
        ...(popupInfo?.x && { left: popupInfo?.x }),
      }}
    >
      <div className="flex flex-col space-y-1">
        {dataIndicators.map((item, index) => {
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
