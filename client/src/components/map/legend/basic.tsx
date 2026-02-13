import { cn } from "@/lib/utils";

import { LegendItemProps } from "@/components/map/legend/item";

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
      {items.map((item, i) => (
        <div key={`legend-quantile-${item.color}-${item.id}-${item.label}-${i}`} className="flex">
          <div
            className="mt-0.5 mr-1 h-2 w-2 shrink-0 rounded-sm shadow-[0_0_1px_0px_rgba(0,0,0,0.25)]"
            style={{
              ...(!!item.image && {
                backgroundImage: `url("data:image/png;base64,${item.image}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }),
              ...(!!item.color && {
                backgroundColor: item.color,
              }),
            }}
          />
          <span className="text-2xs text-foreground font-semibold">{item.label} </span>
        </div>
      ))}
    </div>
  );
}
