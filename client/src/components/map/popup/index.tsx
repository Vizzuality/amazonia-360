import { useMemo } from "react";

import { useAtomValue } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { formatNumber } from "@/lib/formats";
import { useGetH3Indicators } from "@/lib/indicators";

import { gridHoverAtom } from "@/app/store";

export const MapPopup = () => {
  const t = useTranslations();
  const locale = useLocale();
  const gridHover = useAtomValue(gridHoverAtom);

  const { data: H3IndicatorsData } = useGetH3Indicators({ locale });

  const VALUES = useMemo(() => {
    return gridHover.values
      .map((v) => {
        const match = H3IndicatorsData?.find((i) => v.column === i.resource.column);

        if (match) {
          return {
            name: match.name,
            unit: match.unit,
            ...v,
            value: typeof v.value === "number" ? formatNumber(v.value) : undefined,
          };
        }

        return null;
      })
      .filter((v) => v);
  }, [H3IndicatorsData, gridHover.values]);

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

      <p className="text-xs italic text-muted-foreground">{t("grid-map-tooltip")}</p>
    </div>
  );
};

export default MapPopup;
