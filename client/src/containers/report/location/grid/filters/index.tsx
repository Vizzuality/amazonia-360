"use client";

import { useMemo } from "react";

import { flatGroup } from "@visx/vendor/d3-array";
import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";

import { useMeta } from "@/lib/grid";
import { useGetH3Indicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { H3Indicator } from "@/types/indicator";

import { selectedFiltersViewAtom, useSyncGridDatasets } from "@/app/store";
import { useSyncLocation } from "@/app/store";

import { Skeleton } from "@/components/ui/skeleton";

import GridTopicFiltersItem from "./topic-filters-item";

export default function GridFilters() {
  const t = useTranslations();
  const locale = useLocale();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);
  const [gridDatasets] = useSyncGridDatasets();

  const { data: H3IndicatorsData } = useGetH3Indicators(locale);
  const { META, queryMeta, queryMetaFromGeometry } = useMeta(GEOMETRY);

  const { isFetched: gridMetaIsFetched, isFetching: gridMetaIsFetching } = queryMeta;

  const { isFetched: gridMetaFromGeometryIsFetched, isFetching: gridMetaFromGeometryIsFetching } =
    queryMetaFromGeometry;

  const INDICATORS = useMemo(() => {
    if (!H3IndicatorsData || !META) return [];

    return H3IndicatorsData.filter(
      (indicator) => !selectedFiltersView || gridDatasets.includes(indicator.resource.column), // Additional filtering
    )
      .filter((indicator) => {
        const matchingDataset = META.datasets.find(
          (dataset) => dataset.var_name === indicator.resource.column,
        );

        return !!matchingDataset;
      })
      .map((indicator) => {
        const matchingDataset = META.datasets.find(
          (dataset) => dataset.var_name === indicator.resource.column,
        );

        return {
          ...indicator,
          var_name: matchingDataset?.var_name,
          var_dtype: matchingDataset?.var_dtype,
          legend: matchingDataset?.legend,
        } as H3Indicator;
      });
  }, [H3IndicatorsData, META, gridDatasets, selectedFiltersView]);

  const TOPICS = useMemo(() => {
    if (!INDICATORS) return [];

    const groups = flatGroup(INDICATORS, (d) => d.topic.id);

    return groups.sort((a, b) => a[0] - b[0]);
  }, [INDICATORS]);

  return (
    <div className="flex h-full">
      <div className="w-full space-y-1">
        {gridMetaIsFetching ||
          (gridMetaFromGeometryIsFetching && (
            <>
              <div className="py-2">
                <Skeleton className="h-6" />
              </div>
              <div className="py-2">
                <Skeleton className="h-6" />
              </div>
              <div className="py-2">
                <Skeleton className="h-6" />
              </div>
            </>
          ))}

        {!TOPICS.length &&
          ((gridMetaIsFetched && !gridMetaIsFetching && !GEOMETRY) ||
            (gridMetaFromGeometryIsFetched && !gridMetaFromGeometryIsFetching && !!GEOMETRY)) && (
            <div className="flex h-96 items-center justify-center">
              <span className="text-sm text-gray-500">
                {t("grid-sidebar-grid-filters-no-indicators-available")}
              </span>
            </div>
          )}

        {!!TOPICS.length &&
          ((gridMetaIsFetched && !gridMetaIsFetching && !GEOMETRY) ||
            (gridMetaFromGeometryIsFetched && !gridMetaFromGeometryIsFetching && !!GEOMETRY)) &&
          TOPICS?.map((topic) => (
            <GridTopicFiltersItem key={topic[0]} id={topic[0]} datasets={topic[1]} />
          ))}
      </div>
    </div>
  );
}
