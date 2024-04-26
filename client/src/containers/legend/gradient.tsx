import { cn } from "@/lib/utils";

import { LegendItemProps } from "@/containers/legend/item";

export default function LegendGradient({
  items,
  direction = "horizontal",
}: LegendItemProps & { direction?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn({
        "flex justify-start gap-y-1": true,
        "flex flex-col": direction === "vertical",
        "flex-row flex-wrap": direction === "horizontal",
      })}
    >
      <div
        className="w-full h-2 rounded-2xl"
        style={{
          background: `linear-gradient(to right, ${items.map((i) => i.color).join(", ")})`,
        }}
      />

      <div className="flex justify-between space-x-4">
        {items.map((item) => (
          <span key={item.id} className="text-2xs font-medium">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
