"use client";

import { useMemo } from "react";

import { useGetGridMeta, useGetGridTable } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { BodyReadTableGridTablePostFiltersItem } from "@/types/generated/api.schemas";

import {
  useSyncGridDatasets,
  useSyncGridFilters,
  useSyncLocation,
  useSyncGridFiltersSetUp,
} from "@/app/store";

import { CardLoader } from "@/containers/card";

import GridTableItem from "./item";

export default function GridTable() {
  const [location] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridFilters] = useSyncGridFilters();
  const [gridFiltersSetUp] = useSyncGridFiltersSetUp();

  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const queryMeta = useGetGridMeta();

  const queryTable = useGetGridTable(
    {
      body: {
        ...(!!GEOMETRY && {
          geojson: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: GEOMETRY?.toJSON().rings,
            },
          },
        }),
        filters: gridDatasets
          .map((dataset) => {
            const d = queryMeta.data?.datasets.find((d) => d.var_name === dataset);
            if (!d) return [];

            if (d.var_dtype === "Float64") {
              return (gridFilters?.[dataset]?.map((f, i) => ({
                filter_type: "numerical",
                column_name: dataset,
                operation: i === 0 ? "gte" : "lte",
                value: f,
              })) ?? []) satisfies BodyReadTableGridTablePostFiltersItem[];
            }

            return [];
          })
          .flat()
          .filter((f) => f),
      },
      params: {
        level: 1,
        order_by: [`${gridFiltersSetUp?.direction === "asc" ? "" : "-"}${gridDatasets[0]}`],
        limit: gridFiltersSetUp?.limit,
        direction: gridFiltersSetUp?.direction || "asc",
      },
    },
    {
      enabled: !!queryMeta.data?.datasets.length && !!gridDatasets.length,
    },
  );

  const ITEMS = useMemo(() => {
    return Array.from({ length: gridFiltersSetUp?.limit }, (_, i) => {
      return [...gridDatasets, "cell"].reduce(
        (acc, dataset) => {
          const d = queryTable?.data?.table.find((t) => t.column === dataset);
          const cells = queryTable?.data?.cells ?? [];
          if (!d || !d.values.length) return acc;

          return {
            ...acc,
            id: i,
            cell: cells[i],
            [dataset]: d.values[i],
          };
        },
        {} as Record<string, unknown> & { id: number; cell: string },
      );
    }).filter((i) => i.cell);
  }, [gridDatasets, queryTable?.data, gridFiltersSetUp?.limit]);

  return (
    <div className="space-y-2">
      <CardLoader query={[queryTable, queryMeta]} className="h-96">
        {!ITEMS.length && (
          <div className="flex h-96 items-center justify-center">
            <p className="text-base font-medium">No data to display</p>
          </div>
        )}

        {!!ITEMS.length && ITEMS.map((t) => <GridTableItem key={`${t.id}`} {...t} />)}
      </CardLoader>
    </div>
  );
}
