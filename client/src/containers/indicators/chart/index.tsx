import { useMemo } from "react";

import Color from "@arcgis/core/Color";
import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatPercentage } from "@/lib/formats";
import { useQueryFeatureId, useResourceFeatureLayerId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader } from "@/containers/card";

import MarimekkoChart from "@/components/charts/marimekko";
import LegendBasic from "@/components/map/legend/basic";

export interface ChartIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}

export const ChartIndicators = (indicator: ChartIndicatorsProps) => {
  const { id, resource } = indicator;
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryFeatureId({ id, resource, type: "chart", geometry: GEOMETRY });
  const queryResourceFeatureLayer = useResourceFeatureLayerId(indicator);

  const COLOR_SCALE = useMemo(() => {
    const range =
      query.data?.features?.map((d) => {
        const renderer = queryResourceFeatureLayer.data?.drawingInfo?.renderer;

        if (renderer?.type === "simple") {
          const r = renderer as __esri.SimpleRenderer;
          const c = new Color(r.symbol.color);
          return c.toHex() ?? "#009ADE";
        }

        if (renderer?.type === "uniqueValue") {
          const r = renderer as __esri.UniqueValueRenderer;

          const uniqueValue = r.uniqueValueInfos?.find(
            // @ts-expect-error- I don't know why the type does not correspond to the real data.
            // It's true that the documentation says that "field1" does not exists https://developers.arcgis.com/javascript/latest/api-reference/esri-renderers-UniqueValueRenderer.html#field
            (u) => `${u.value}` === `${d.attributes[r.field1]}`,
          );

          if (uniqueValue) {
            const c = new Color(uniqueValue?.symbol.color);
            return c.toHex() ?? "#009ADE";
          }
        }

        if (renderer?.type === "classBreaks") {
          const r = renderer as __esri.ClassBreaksRenderer;
          const classBreak = r.classBreakInfos?.find(
            // @ts-expect-error- I don't know why the type does not correspond to the real data.
            // It's true that the documentation says that "classMaxValue" does not exists https://developers.arcgis.com/javascript/latest/api-reference/esri-renderers-support-ClassBreakInfo.html
            (u) => `${u.classMaxValue}` === `${d.attributes[r.field]}`,
          );

          if (classBreak) {
            const c = new Color(classBreak?.symbol.color);
            return c.toHex() ?? "#009ADE";
          }
        }

        return "#009ADE";
      }) ?? [];

    return scaleOrdinal({
      domain: query.data?.features?.map((d) => d.attributes.label) ?? [],
      range: range.length ? range : CHROMA.scale("Spectral").colors(10),
    });
  }, [query.data, queryResourceFeatureLayer.data]);

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

    return query.data.features
      .map((feature, i) => {
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
          id: feature.attributes.label + i,
          parent: "root",
          label: feature.attributes.label,
          size: feature.attributes.value / TOTAL,
          color: COLOR_SCALE(feature.attributes.label),
        };
      })
      .sort((a, b) => b.size - a.size);
  }, [resource, query.data, TOTAL, COLOR_SCALE]);

  return (
    <CardLoader query={[query, queryResourceFeatureLayer]} className="grow">
      <MarimekkoChart
        data={DATA}
        format={(d) => formatPercentage(d.value)}
        className="h-full grow"
      />
      <div className="py-1">
        <LegendBasic items={DATA} type="basic" />
      </div>
    </CardLoader>
  );
};
