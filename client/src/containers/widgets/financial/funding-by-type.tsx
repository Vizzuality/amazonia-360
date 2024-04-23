"use client";

import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { LegendOrdinal } from "@visx/legend";
import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardLoader, CardTitle } from "@/containers/card";

import MarimekkoChart, { Data } from "@/components/charts/marimekko";

export default function WidgetFundingByType() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.idb_operations.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.idb_operations.layer,
    },
    {
      enabled: !!DATASETS.idb_operations.getFeatures && !!GEOMETRY,
      select(data): Data[] {
        const t: number = data?.features
          ?.map((f) => f.attributes.totalamount)
          ?.reduce((a, b) => a + b, 0);

        return data.features
          ?.map((f) => f.attributes)
          ?.map((d) => ({
            id: d.opertype,
            size: d.totalamount / t,
            label: d.opertype,
            parent: "root",
            color: "blue",
          }))
          ?.reduce((acc, curr) => {
            const index = acc.findIndex((a) => a.id === curr.id);

            if (index === -1) {
              acc.push(curr);
            } else {
              acc[index].size = (acc[index]?.size ?? 0) + curr.size;
            }

            return acc;
          }, [] as Data[])
          ?.toSorted((a, b) => b.size - a.size);
      },
    },
  );

  const ordinalColorScale = scaleOrdinal({
    domain: query?.data?.map((d) => d),
    // range,
    range: CHROMA.scale(["#2D6485", "#009ADE", "#B7DBF2"]).colors(
      query?.data?.length || 0,
    ),
  });

  const FORMAT = (node: HierarchyRectangularNode<HierarchyNode<Data>>) => {
    return formatPercentage(node?.value || 0, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card className="flex flex-col grow">
      <CardTitle>IDB operations</CardTitle>

      <CardLoader query={[query]} className="h-44">
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
                      className="flex"
                    >
                      <div
                        className="w-2 h-2 shrink-0 mt-px mr-1 border border-black"
                        style={{
                          backgroundColor: label.value,
                        }}
                      />
                      <span className="text-2xs font-semibold text-gray-500">
                        {label.datum.label}{" "}
                        <span>
                          (
                          {label.datum.size > 0.01 &&
                            formatPercentage(label.datum.size, {
                              maximumFractionDigits: 0,
                            })}
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
