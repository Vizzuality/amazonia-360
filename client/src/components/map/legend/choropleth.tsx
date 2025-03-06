import { LegendItemProps } from "@/components/map/legend/item";

export default function LegendChoropleth({
  items,
}: LegendItemProps & { direction?: "horizontal" | "vertical" }) {
  return (
    <div>
      <ul className="flex w-full">
        {items.map(({ image, color }) => (
          <li
            key={`${color || image}`}
            className="h-2 flex-shrink-0"
            style={{
              width: `${100 / items.length}%`,
              ...(!!image && {
                backgroundImage: `url("data:image/png;base64,${image}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "repeat",
              }),
              ...(!!color && {
                backgroundColor: color,
              }),
            }}
          />
        ))}
      </ul>

      <ul className="mt-1 flex w-full">
        {items.map(({ label }, i) => (
          <li
            key={`${label}-${i}`}
            className="flex-shrink-0 text-center text-2xs"
            style={{
              width: `${100 / items.length}%`,
            }}
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
