import { useMemo } from "react";

import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatPercentage } from "@/lib/formats";
import { useQueryFeatureId } from "@/lib/indicators";

import { ResourceFeature } from "@/app/api/indicators/route";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart from "@/components/charts/marimekko";

export interface ChartIndicatorsProps {
  resource: ResourceFeature;
}

export const ChartIndicators = ({ resource }: ChartIndicatorsProps) => {
  const query = useQueryFeatureId({ resource, type: "chart" });

  const COLOR_SCALE = useMemo(() => {
    return scaleOrdinal({
      domain: query.data?.features?.map((d) => d.attributes) ?? [],
      range: CHROMA.scale(["#009ADE", "#93CAEB", "#DBEDF8"]).colors(
        query.data?.features?.length || 1,
      ),
    });
  }, [query.data]);

  const TOTAL = useMemo(() => {
    if (!query.data) return 0;

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

  const DATA = useMemo(() => {
    if (!query.data) return [];

    return query.data.features.map((feature) => {
      const GROUPS = resource[`query_chart`]?.groupByFieldsForStatistics;

      if (!!GROUPS && GROUPS.length) {
        return {
          id: feature.attributes[GROUPS?.[0]],
          parent: "root",
          label: feature.attributes[GROUPS?.[0]],
          size: feature.attributes.value / TOTAL,
          color: COLOR_SCALE(feature.attributes[GROUPS?.[0]]),
        };
      }

      return {
        id: feature.attributes.label,
        parent: "root",
        label: feature.attributes.label,
        size: feature.attributes.value / TOTAL,
        color: COLOR_SCALE(feature.attributes.label),
      };
    });
  }, [resource, query.data, TOTAL, COLOR_SCALE]);

  return (
    <Card>
      <CardTitle>{resource.name}</CardTitle>
      <CardContent>
        <CardLoader query={[query]} className="h-72">
          <MarimekkoChart data={DATA} format={(d) => formatPercentage(d.value)} />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
