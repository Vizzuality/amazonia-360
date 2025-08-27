import { Indicator, ResourceImagery, ResourceImageryTile } from "@/types/indicator";

import Legend from "@/components/map/legend";
import LegendItem from "@/components/map/legend/item";

export interface ImageryLegendProps {
  indicator: Indicator;
}

export const ImageryLegend = ({
  resource,
}: Omit<Indicator, "resource"> & {
  resource: ResourceImagery | ResourceImageryTile;
}) => {
  const LEGEND = resource.legend;
  return <Legend defaultOpen>{!!LEGEND && <LegendItem {...LEGEND} direction="vertical" />}</Legend>;
};
