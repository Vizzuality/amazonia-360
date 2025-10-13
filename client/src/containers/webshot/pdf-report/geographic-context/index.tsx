"use client";

import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { useGetOverviewTopics } from "@/lib/topics";

import {
  Indicator,
  ResourceFeature,
  ResourceWebTile,
  ResourceImageryTile,
} from "@/types/indicator";

import { MapIndicators } from "../../../indicators/map";

import { DataRow } from "./components";

export default function PfdGeographicContext() {
  const locale = useLocale();

  const { data } = useGetOverviewTopics({ locale });

  const DATA = useMemo(() => {
    if (!data) return null;
    return data.find((topic) => topic.id === 0);
  }, [data]);

  const indicators = DATA?.default_visualization.filter(
    (indicator) => indicator.type === "numeric",
  );

  const map = data?.[0].default_visualization.find((topic) => topic.type === "map");
  const mapIndicator = useGetIndicatorsId(map?.id || -1, locale);

  if (!data) return null;

  return (
    <div className="relative flex h-full">
      <div className="flex w-[50%] flex-col justify-center gap-8 bg-blue-50 px-14">
        <h1 className="text-2xl text-primary">{DATA?.name}</h1>
        {/* TODO: Find a way to get this without doing the same requests all over again} */}
        {/* <p className="font-medium">
          The selected area intersects 1 state, 4 municipalities and 5 capital cities
        </p> */}
        <div className="flex flex-col">
          {indicators &&
            indicators?.map((indicator, index) => (
              <DataRow
                key={`${indicator.id}-${index}`}
                locale={locale}
                indicatorId={indicator.id}
              />
            ))}
        </div>
      </div>
      <div className="h-full w-[50%] bg-gray-400">
        {map && mapIndicator && (
          <MapIndicators
            {...(mapIndicator as Omit<Indicator, "resource"> & {
              resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
            })}
            basemapId={map.basemapId}
            isWebshot={true}
            isPdf={true}
          />
        )}
      </div>
    </div>
  );
}
