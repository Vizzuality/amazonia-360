"use client";

import { HierarchyNode, HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatPercentage } from "@/lib/formats";
import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import {
  Card,
  CardControls,
  CardHeader,
  CardInfo,
  CardLoader,
  CardNoData,
  CardTitle,
} from "@/containers/card";
import LegendOrdinal from "@/containers/legend/ordinal";
import { IDBOperation } from "@/containers/widgets/financial/types";

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
          ?.map((f) => f.attributes as IDBOperation)
          ?.map((d) => ({
            id: `${d.sector}`,
            size: (d.idbamount || 0) / t,
            label: `${d.sector}`,
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
    range: CHROMA.scale(["#2D6485", "#009ADE", "#B7DBF2"]).colors(query?.data?.length || 0),
  });

  const FORMAT = (node: HierarchyRectangularNode<HierarchyNode<Data>>) => {
    return formatPercentage(node?.value || 0, {
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card className="grow">
      <CardHeader>
        <CardTitle>IDB funding by sector</CardTitle>
        <CardControls>
          <CardInfo ids={["idb_operations"]} />
        </CardControls>
      </CardHeader>

      <CardLoader query={[query]} className="h-44">
        <CardNoData query={[query]}>
          <div className="flex grow flex-col space-y-2 pt-2">
            <MarimekkoChart format={FORMAT} data={query.data || []} className="h-full grow" />

            <LegendOrdinal ordinalColorScale={ordinalColorScale} />
          </div>
        </CardNoData>
      </CardLoader>
    </Card>
  );
}
