import LegendBasic from "@/containers/legend/basic";
import LegendGradient from "@/containers/legend/gradient";

export interface LegendItemProps {
  type: "basic" | "gradient";
  items: {
    id: string | number;
    label: string | null;
    color: string;
  }[];
  direction?: "horizontal" | "vertical";
}

export default function LegendItem(config: LegendItemProps) {
  const { type } = config;

  return (
    <>
      {type === "basic" && <LegendBasic {...config} />}
      {type === "gradient" && <LegendGradient {...config} />}
    </>
  );
}
