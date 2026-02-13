import { LegendOrdinal as VxLegendOrdinal } from "@visx/legend";
import { ScaleOrdinal } from "@visx/vendor/d3-scale";

import { formatPercentage } from "@/lib/formats";
import { cn } from "@/lib/utils";

export type LegendOrdinalT = {
  id: string;
  label: string;
  color: string;
  size?: number;
};

export default function LegendOrdinal<T extends LegendOrdinalT>({
  direction = "horizontal",
  ordinalColorScale,
}: {
  ordinalColorScale?: ScaleOrdinal<T, string, never>;
  direction?: "horizontal" | "vertical";
}) {
  if (!ordinalColorScale) {
    return null;
  }

  return (
    <VxLegendOrdinal scale={ordinalColorScale} className="w-full">
      {(labels) => (
        <div
          className={cn({
            "flex justify-start gap-y-1": true,
            "flex flex-col": direction === "vertical",
            "flex-row flex-wrap gap-x-2": direction === "horizontal",
          })}
        >
          {labels.map((label) => (
            <div key={`legend-quantile-${label.datum.id}`} className="flex">
              <div
                className="mt-0.5 mr-1 h-2 w-2 shrink-0 rounded-[2px] shadow-[0_0_1px_0px_rgba(0,0,0,0.25)]"
                style={{
                  backgroundColor: label.value,
                }}
              />
              <span className="text-2xs text-foreground font-semibold">
                {label.datum.label}{" "}
                {!!label.datum.size && (
                  <span>
                    (
                    {label.datum.size > 0.01 &&
                      formatPercentage(label.datum.size, {
                        maximumFractionDigits: 0,
                      })}
                    {label.datum.size <= 0.01 && `<1%`})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </VxLegendOrdinal>
  );
}
