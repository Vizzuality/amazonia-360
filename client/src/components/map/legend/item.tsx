import LegendBasic from "@/components/map/legend/basic";
import LegendChoropleth from "@/components/map/legend/choropleth";
import LegendGradient from "@/components/map/legend/gradient";

export interface LegendItemProps {
  id?: string | number;
  type: "basic" | "gradient" | "choropleth";
  items: {
    id: string | number;
    label: string | null;
    color?: string;
    image?: string;
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
