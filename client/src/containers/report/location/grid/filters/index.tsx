"use client";

import { useMemo } from "react";

import { flatGroup } from "@visx/vendor/d3-array";
import { useAtom } from "jotai";

import { useGetGridMeta, useGetGridMetaFromGeometry } from "@/lib/grid";
import { useH3Indicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Feature, FeatureGeometry } from "@/types/generated/api.schemas";

import { H3Indicator } from "@/app/local-api/indicators/route";
import { selectedFiltersViewAtom, useSyncGridDatasets } from "@/app/store";
import { useSyncLocation } from "@/app/store";

import { Skeleton } from "@/components/ui/skeleton";

import GridTopicFiltersItem from "./topic-filters-item";

export default function GridFilters() {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);
  const [gridDatasets] = useSyncGridDatasets();

  const feature = useMemo<Feature>(() => {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: GEOMETRY?.toJSON().rings,
      } as FeatureGeometry,
      properties: {},
      id: null,
    };
  }, [GEOMETRY]);

  const dataIndicators = useH3Indicators();

  const {
    data: gridMetaData,
    isFetched: gridMetaIsFetched,
    isFetching: gridMetaIsFetching,
  } = useGetGridMeta({
    enabled: !GEOMETRY,
  });

  const {
    data: gridMetaFromGeometryData,
    isFetched: gridMetaFromGeometryIsFetched,
    isFetching: gridMetaFromGeometryIsFetching,
  } = useGetGridMetaFromGeometry(
    feature,
    {},
    {
      enabled: !!GEOMETRY,
    },
  );

  const META = useMemo(() => {
    if (GEOMETRY) return gridMetaFromGeometryData;

    return gridMetaData;
  }, [gridMetaData, gridMetaFromGeometryData, GEOMETRY]);

  const INDICATORS = useMemo(() => {
    if (!dataIndicators || !META) return [];

    return dataIndicators
      .filter(
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
  }, [dataIndicators, META, gridDatasets, selectedFiltersView]);

  const TOPICS = useMemo(() => {
    if (!INDICATORS) return [];

    const groups = flatGroup(INDICATORS, (d) => d.topic.id);

    return groups;
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
              <span className="text-sm text-gray-500">No indicators available</span>
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
