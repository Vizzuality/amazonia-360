"use client";

import { useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetGridMeta, useGetGridTable } from "@/lib/grid";
import { useGetH3Indicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { BodyReadTableGridTablePost } from "@/types/generated/api.schemas";

import {
  useSyncGridDatasets,
  useSyncGridDatasetContinousSettings,
  useSyncLocation,
  useSyncGridTableSettings,
  useSyncGridDatasetCategoricalSettings,
} from "@/app/(frontend)/store";

import { CardLoader } from "@/containers/card";
import GridTableSetup from "@/containers/report/grid/table/setup";

import GridTableItem from "./item";

export default function GridTable() {
  const t = useTranslations();
  const locale = useLocale();
  const [location] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridDatasetContinousSettings] = useSyncGridDatasetContinousSettings();
  const [gridDatasetCategoricalSettings] = useSyncGridDatasetCategoricalSettings();
  const [gridTableSettings] = useSyncGridTableSettings();

  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const queryH3Indicators = useGetH3Indicators({ locale });

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
            const f = [] as BodyReadTableGridTablePost["filters"];
            const d = queryMeta.data?.datasets.find((d) => d.var_name === dataset);
            if (!d) return f;

            if (d.legend.legend_type === "continuous") {
              gridDatasetContinousSettings?.[dataset]?.forEach((v, i) => {
                f.push({
                  filter_type: "numerical",
                  column_name: dataset,
                  operation: i === 0 ? "gte" : "lte",
                  value: v,
                });
              });
            }

            if (d.legend.legend_type === "categorical" && "entries" in d.legend) {
              if (gridDatasetCategoricalSettings?.[dataset]) {
                f.push({
                  filter_type: "categorical",
                  column_name: dataset,
                  operation: "in",
                  value: gridDatasetCategoricalSettings?.[dataset],
                });
              }
            }

            return f;
          })
          .flat()
          .filter((f) => f),
      },
      params: {
        level: 1,
        order_by: [`${gridTableSettings?.direction === "asc" ? "" : "-"}${gridDatasets[0]}`],
        limit: gridTableSettings?.limit,
      },
    },
    {
      enabled: !!queryMeta.data?.datasets.length && !!gridDatasets.length,
    },
  );

  const ITEMS = useMemo(() => {
    return Array.from({ length: gridTableSettings?.limit }, (_, i) => {
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
  }, [gridDatasets, queryTable?.data, gridTableSettings?.limit]);

  const SORT_DATASET_NAME = useMemo(() => {
    if (!gridDatasets.length || !queryH3Indicators.data) return "";
    const d = queryH3Indicators.data?.find(
      (dataset) => dataset.resource.column === gridDatasets[0],
    );

    if (!d) return "";

    return d.name ?? "";
  }, [gridDatasets, queryH3Indicators.data]);

  return (
    <div className="space-y-2">
      <CardLoader query={[queryTable, queryMeta, queryH3Indicators]} className="h-96">
        {!ITEMS.length && (
          <div className="flex h-96 items-center justify-center">
            <p className="text-base font-medium">
              {t("grid-sidebar-grid-filters-ranking-title-no-filter")}
            </p>
          </div>
        )}

        {!!ITEMS.length && (
          <div>
            <header className="flex justify-between gap-2">
              <h2 className="mt-1.5 text-sm font-bold">
                {t("grid-sidebar-grid-filters-ranking-title")} {`"${SORT_DATASET_NAME}"`}
              </h2>
              <GridTableSetup />
            </header>

            {ITEMS.map((t) => (
              <GridTableItem key={`${t.id}`} {...t} />
            ))}
          </div>
        )}
      </CardLoader>
    </div>
  );
}
