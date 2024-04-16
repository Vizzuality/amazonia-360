"use client";

import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { LegendOrdinal } from "@visx/legend";
import { scaleOrdinal } from "@visx/scale";

import { useFormatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetIntersectionAnalysis } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { Card, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetEcosystemsByType() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetIntersectionAnalysis(
    {
      id: "ecosistemas",
      polygon: GEOMETRY,
    },
    {
      enabled: !!GEOMETRY,

      select(data) {
        const { areas } = data;

        return data?.features
          ?.map((f) => {
            return {
              id: f.attributes.ECO_NAME,
              parent: "root",
              size: f.area / (areas || 1),
              label: f.attributes.ECO_NAME,
              color: "blue",
            };
          })
          ?.reduce((acc, curr) => {
            const index = acc.findIndex((a) => a.id === curr.id);

            if (index === -1) {
              acc.push(curr);
            } else {
              acc[index].size = (acc[index]?.size ?? 0) + curr.size;
            }

            return acc;
          }, [] as Data[])
          ?.filter((u) => u.size > 0.001)
          ?.toSorted((a, b) => {
            if (!a.size || !b.size) return 0;

            return b.size - a.size;
          });
      },
    },
  );

  const ordinalColorScale = scaleOrdinal({
    domain: query?.data?.map((d) => d),
    range: ["#40551F", "#668A26", "#8ABD2D", "#B0E33A", "#D6FF47"],
  });

  const { format } = useFormatPercentage({
    maximumFractionDigits: 0,
  });

  const FORMAT = (node: HierarchyRectangularNode<HierarchyNode<Data>>) => {
    return format(node?.value || 0);
  };

  return (
    <Card>
      <CardTitle>Ecosystems by type</CardTitle>
      <CardLoader query={[query]} className="h-52">
        {!!query.data && (
          <div className="space-y-2 pt-2">
            <MarimekkoChart
              format={FORMAT}
              colorScale={ordinalColorScale}
              data={query.data || []}
            />

            <LegendOrdinal scale={ordinalColorScale} className="w-full">
              {(labels) => (
                <div className="flex flex-wrap justify-start gap-y-1 gap-x-3">
                  {labels.map((label) => (
                    <div
                      key={`legend-quantile-${label.datum.id}`}
                      className="flex items-center"
                    >
                      <div
                        className="w-2 h-2 mr-1 border border-black"
                        style={{
                          backgroundColor: label.value,
                        }}
                      />
                      <span className="text-2xs font-semibold text-gray-500">
                        {label.datum.label}{" "}
                        <span>
                          ({label.datum.size > 0.01 && format(label.datum.size)}
                          {label.datum.size <= 0.01 && `<1%`})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </LegendOrdinal>
          </div>
        )}
      </CardLoader>
    </Card>
  );
}
