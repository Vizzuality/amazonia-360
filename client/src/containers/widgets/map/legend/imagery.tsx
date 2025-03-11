import { Indicator, ResourceImagery, ResourceImageryTile } from "@/app/local-api/indicators/route";

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
