import { Indicator, ResourceImagery, ResourceImageryTile } from "@/types/indicator";

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
  return <>{!!LEGEND && <LegendItem {...LEGEND} direction="vertical" />}</>;
};
