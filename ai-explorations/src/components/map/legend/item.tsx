import LegendBasic from "@/components/map/legend/basic";
import LegendChoropleth from "@/components/map/legend/choropleth";
import LegendGradient from "@/components/map/legend/gradient";

export interface LegendItemProps {
  id?: string | number;
  type: "basic" | "gradient" | "choropleth";
  items: {
    // Payload gives an array row its id only once the document has been saved, so an item
    // authored through the REST API arrives without one. Keys fall back to the position.
    id?: string | number | null;
    label?: string | null;
    color?: string | null;
    image?: string | null;
  }[];
  direction?: "horizontal" | "vertical";
}

export default function LegendItem(config: LegendItemProps) {
  const { type } = config;

  return (
    <>
      {type === "basic" && <LegendBasic {...config} />}
      {type === "gradient" && <LegendGradient {...config} />}
      {type === "choropleth" && <LegendChoropleth {...config} />}
    </>
  );
}
