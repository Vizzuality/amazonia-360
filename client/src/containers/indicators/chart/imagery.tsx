import { useMemo } from "react";

import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatPercentage } from "@/lib/formats";
import { useQueryImageryTileId } from "@/lib/indicators";

import { Indicator, ResourceImageryTile, VisualizationType } from "@/app/api/indicators/route";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart from "@/components/charts/marimekko";

export interface ChartImageryIndicatorsProps extends Indicator {
  type: VisualizationType;
  resource: ResourceImageryTile;
}

export const ChartImageryIndicators = ({ name, resource }: ChartImageryIndicatorsProps) => {
  const query = useQueryImageryTileId({ resource, type: "chart" });

  const COLOR_SCALE = useMemo(() => {
    if (!query.data) return null;

    const domain =
      query.data?.RAT.features.map((d) => ({
        size: d.attributes.Value,
      })) ?? [];
    const range = CHROMA.scale(
      query.data?.RAT.features.map((d) =>
        CHROMA([d.attributes.Red, d.attributes.Green, d.attributes.Blue]),
      ) ?? [],
    ).colors(query.data?.RAT.features.length || 1);

    return scaleOrdinal({
      domain,
      range,
    });
  }, [query.data]);

  const TOTAL = useMemo(() => {
    if (!query.data) return 0;

    return query.data.histograms.reduce((acc, curr) => {
      return acc + [...curr.counts].reduce((a, c) => a + c, 0);
    }, 0);
  }, [query.data]);

  const DATA = useMemo(() => {
    if (!query.data || !COLOR_SCALE) return [];

    const h = query.data.histograms[0];
    const s = query.data.statistics[0];
    const RAT = query.data.RAT;

    return RAT.features.map((feature) => {
      return {
        id: feature.attributes.Class,
        parent: "root",
        label: feature.attributes.Class,
        size: h.counts[feature.attributes.Value - s.min] / TOTAL,
        color: COLOR_SCALE({ size: feature.attributes.Value }),
      };
    });
  }, [query.data, TOTAL, COLOR_SCALE]);

  return (
    <Card>
      <CardTitle>{name}</CardTitle>
      <CardContent>
        <CardLoader query={[query]} className="h-72">
          <MarimekkoChart data={DATA} format={(d) => formatPercentage(d.value)} />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
