import { useMemo } from "react";

import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatPercentage } from "@/lib/formats";
import { useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader } from "@/containers/card";

import MarimekkoChart from "@/components/charts/marimekko";

export interface ChartIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}

export const ChartIndicators = ({ id, resource }: ChartIndicatorsProps) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryFeatureId({ id, resource, type: "chart", geometry: GEOMETRY });

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

    const R = resource[`query_chart`];

    if (R?.returnIntersections) {
      return query.data.features.reduce((acc, curr) => {
        return curr.attributes.total;
      }, 0);
    }

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [resource, query.data]);

  const DATA = useMemo(() => {
    if (!query.data) return [];

    const R = resource[`query_chart`];
    const GROUPS = R?.groupByFieldsForStatistics;

    return query.data.features.map((feature) => {
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
    <CardLoader query={[query]} className="grow">
      <MarimekkoChart
        data={DATA}
        format={(d) => formatPercentage(d.value)}
        className="h-full grow"
      />
    </CardLoader>
  );
};
