import { useMemo } from "react";

import { useAtomValue } from "jotai";

import { formatNumber } from "@/lib/formats";
import { useH3Indicators } from "@/lib/indicators";

import { gridHoverAtom } from "@/app/store";

export const MapPopup = () => {
  const gridHover = useAtomValue(gridHoverAtom);

  const dataIndicators = useH3Indicators();

  const VALUES = useMemo(() => {
    return gridHover.values
      .map((v) => {
        const match = dataIndicators?.find((i) => v.column === i.resource.column);

        if (match) {
          return {
            name: match.name_en,
            unit: match.unit_en,
            ...v,
            value: typeof v.value === "number" ? formatNumber(v.value) : undefined,
          };
        }

        return null;
      })
      .filter((v) => v);
  }, [dataIndicators, gridHover.values]);

  if (!gridHover.x || !gridHover.y) return null;

  return (
    <div
      className="pointer-events-none absolute flex min-w-60 flex-col space-y-1.5 rounded-lg bg-white p-4 shadow-md"
      style={{
        ...(gridHover?.y && { top: gridHover?.y + 10 }),
        ...(gridHover?.x && { left: gridHover?.x + 10 }),
      }}
    >
      <div className="flex flex-col space-y-1">
        {VALUES.map((v) => (
          <div key={`${v?.name}-${v?.value}`} className="flex justify-between space-x-2">
            <p className="text-sm font-semibold text-foreground">{v?.name}</p>
            <p className="text-sm font-medium text-foreground">{v?.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs italic text-muted-foreground">
        Click on the cell to redefine the area of interest
      </p>
    </div>
  );
};

export default MapPopup;
