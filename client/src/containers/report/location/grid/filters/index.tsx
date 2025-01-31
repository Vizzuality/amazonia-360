"use client";

import { useAtom } from "jotai";
import proj4 from "proj4";

import { useGetGridMetaFromGeometry } from "@/lib/grid";
import { useIndicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import {
  DatasetMeta,
  DatasetMetaLegend,
  Feature,
  FeatureBbox,
  FeatureGeometry,
} from "@/types/generated/api.schemas";

import { H3Indicator, Indicator } from "@/app/local-api/indicators/route";
import { selectedFiltersViewAtom, useSyncGridDatasets } from "@/app/store";
import { useSyncBbox, useSyncLocation } from "@/app/store";

import { Topic } from "@/constants/topics";

import GridTopicFiltersItem from "./topic-filters-item";

proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:3857", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs");

export default function GridFilters() {
  const [bbox] = useSyncBbox();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);
  const [gridDatasets] = useSyncGridDatasets();
  const geometry3857: FeatureGeometry = {
    type: "Polygon",
    coordinates: GEOMETRY?.toJSON().rings,
  };

  const geometry4326: FeatureGeometry = {
    type: geometry3857.type,
    coordinates: geometry3857?.coordinates?.map((ring) =>
      ring.map((point) => proj4("EPSG:3857", "EPSG:4326", point)),
    ),
  };

  const feature: Feature = {
    bbox: bbox as FeatureBbox,
    type: "Feature",
    geometry: geometry4326,
    properties: {},
    id: null,
  };

  const { data: dataIndicators } = useIndicators();

  const { data: gridMetaData } = useGetGridMetaFromGeometry<
    {
      id: number;
      datasets: (DatasetMeta & { id: number })[];
    }[]
  >(
    feature,
    {},
    {
      select: (data) => {
        if (!data || !data.datasets || !dataIndicators) return [];

        // Filter datasets from dataIndicators where resource.type === "h3" making sure returned resource is of type H3Indicator
        const filteredIndicators: (Omit<Indicator, "resource" | "topic"> & {
          resource: H3Indicator;
          topic: Topic;
        })[] = dataIndicators.filter(
          (indicator) =>
            indicator.resource.type === "h3" &&
            (!selectedFiltersView || gridDatasets.includes(indicator.resource.column)), // Additional filtering
        ) as (Omit<Indicator, "resource" | "topic"> & { resource: H3Indicator; topic: Topic })[];

        // Map each topic into an object with its datasets
        const groupedByTopic = filteredIndicators.reduce<
          Record<
            number,
            {
              label: string;
              id: number;
              unit: string;
              description_short: string;
              description: string;
              var_name: string;
              legend: DatasetMetaLegend;
              var_dtype: string;
            }[]
          >
        >((acc, indicator) => {
          const topicId = indicator.topic.id;

          const matchingDataset = data.datasets.find(
            (dataset) => dataset.var_name === indicator.resource.column,
          );

          if (!matchingDataset) return acc;

          if (!acc[topicId]) acc[topicId] = [];

          acc[topicId].push({
            label: indicator.name,
            id: indicator.id,
            unit: indicator.unit,
            description_short: indicator.description_short || "",
            description: indicator.description || "",
            var_name: matchingDataset.var_name,
            legend: matchingDataset.legend,
            var_dtype: matchingDataset.var_dtype,
          });

          return acc;
        }, {});

        return Object.entries(groupedByTopic).map(([id, datasets]) => ({
          id: Number(id),
          datasets,
        }));
      },
      enabled: !!location && !!feature,
    },
  );

  return (
    <div className="flex h-full">
      <div className="w-full space-y-1">
        {!!gridMetaData?.length &&
          gridMetaData?.map((dataset) => <GridTopicFiltersItem key={dataset.id} {...dataset} />)}
      </div>
    </div>
  );
}
