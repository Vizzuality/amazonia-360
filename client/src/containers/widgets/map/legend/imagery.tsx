import { useMemo } from "react";

import { useResourceImageryLegendId } from "@/lib/indicators";

import { Indicator, ResourceImagery, ResourceImageryTile } from "@/app/local-api/indicators/route";

import { CardLoader } from "@/containers/card";

import Legend from "@/components/map/legend";
import LegendItem, { LegendItemProps } from "@/components/map/legend/item";

export interface ImageryLegendProps {
  indicator: Indicator;
}

export const ImageryLegend = ({
  resource,
}: Omit<Indicator, "resource"> & {
  resource: ResourceImagery | ResourceImageryTile;
}) => {
  const query = useResourceImageryLegendId({ resource });

  const { data: legendData } = query;

  const LEGENDS = useMemo<LegendItemProps[] | null>(() => {
    if (!legendData) return null;

    return legendData.layers.map((layer, i) => {
      return {
        id: `${layer.id}-${i}`,
        title: layer.title,
        type: "basic",
        items: layer.legend.map((l, j) => {
          return {
            id: `${l.label}-${j}`,
            image: l.imageData,
            label: l.label,
          };
        }),
      };
    });
  }, [legendData]);

  return (
    <Legend defaultOpen>
      <CardLoader query={[query]} className="h-10 grow">
        {!!LEGENDS &&
          LEGENDS.map((legend) => {
            if (!legend) return null;
            return <LegendItem key={legend.id} {...legend} direction="vertical" />;
          })}
      </CardLoader>
    </Legend>
  );
};
