import { LegendOrdinal as VxLegendOrdinal } from "@visx/legend";
import { ScaleOrdinal } from "@visx/vendor/d3-scale";

import { formatPercentage } from "@/lib/formats";

import { Data } from "@/components/charts/marimekko";

export default function LegendOrdinal({
  ordinalColorScale,
}: {
  ordinalColorScale: ScaleOrdinal<Data, string>;
}) {
  return (
    <VxLegendOrdinal scale={ordinalColorScale} className="w-full">
      {(labels) => (
        <div className="flex flex-wrap justify-start gap-y-1 gap-x-3">
          {labels.map((label) => (
            <div key={`legend-quantile-${label.datum.id}`} className="flex">
              <div
                className="w-2 h-2 rounded-[2px] shrink-0 mt-px mr-1 shadow-sm"
                style={{
                  backgroundColor: label.value,
                }}
              />
              <span className="text-2xs font-semibold text-foreground">
                {label.datum.label}{" "}
                <span>
                  (
                  {label.datum.size > 0.01 &&
                    formatPercentage(label.datum.size, {
                      maximumFractionDigits: 0,
                    })}
                  {label.datum.size <= 0.01 && `<1%`})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </VxLegendOrdinal>
  );
}
