import { cn } from "@/lib/utils";

import { LegendItemProps } from "@/containers/legend/item";

export default function LegendBasic({
  items,
  direction = "horizontal",
}: LegendItemProps & {
  direction?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn({
        "flex justify-start gap-y-1": true,
        "flex flex-col": direction === "vertical",
        "flex-row flex-wrap gap-x-2": direction === "horizontal",
      })}
    >
      {items.map((item) => (
        <div key={`legend-quantile-${item.id}`} className="flex">
          <div
            className="w-2 h-2 rounded-[2px] shrink-0 mt-0.5 mr-1 shadow-[0_0_1px_0px_rgba(0,0,0,0.25)]"
            style={{
              backgroundColor: item.color,
            }}
          />
          <span className="text-2xs font-semibold text-foreground">
            {item.label}{" "}
          </span>
        </div>
      ))}
    </div>
  );
}
