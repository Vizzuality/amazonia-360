import { useMemo } from "react";

import { useAtomValue } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { formatNumber } from "@/lib/formats";
import { useGetGridMeta } from "@/lib/grid";
import { useGetH3Indicators } from "@/lib/indicators";

import { gridHoverAtom } from "@/app/(frontend)/store";

export const MapPopup = () => {
  const t = useTranslations();
  const locale = useLocale();
  const gridHover = useAtomValue(gridHoverAtom);

  const { data: H3IndicatorsData } = useGetH3Indicators({ locale });
  const { data: metaData } = useGetGridMeta();

  const VALUES = useMemo(() => {
    return gridHover.values
      .map((v) => {
        const match = H3IndicatorsData?.find((i) => v.column === i.resource.column);
        const metaMatch = metaData?.datasets.find((d) => d.var_name === v.column);

        if (match && metaMatch) {
          return {
            name: match.name,
            unit: match.unit,
            ...v,
            // Continuous value
            ...(metaMatch?.legend.legend_type === "continuous" &&
              typeof v.value === "number" && {
                value: formatNumber(v.value),
              }),
            // Categorical value
            ...(metaMatch?.legend.legend_type === "categorical" &&
              "entries" in metaMatch.legend && {
                value: metaMatch.legend.entries.find((e) => e.value === v.value)?.label,
              }),
          };
        }

        return null;
      })
      .filter((v) => v);
  }, [H3IndicatorsData, metaData, gridHover.values]);

  if (!gridHover.x || !gridHover.y) return null;

  return (
    <div
      className="pointer-events-none absolute flex max-w-72 min-w-60 flex-col space-y-1.5 rounded-lg bg-white p-4 shadow-md"
      style={{
        ...(gridHover?.y && { top: gridHover?.y + 10 }),
        ...(gridHover?.x && { left: gridHover?.x + 10 }),
      }}
    >
      <div className="flex flex-col space-y-1">
        {VALUES.map((v) => (
          <div key={`${v?.name}-${v?.value}`} className="flex justify-between space-x-4">
            <p className="text-foreground text-xs font-semibold">{v?.name}</p>
            <p className="text-foreground text-right text-xs font-medium">{v?.value}</p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-xs italic">{t("grid-map-tooltip")}</p>
    </div>
  );
};

export default MapPopup;
