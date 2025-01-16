"use client";

import { useAtom } from "jotai";
import proj4 from "proj4";

import { useGetGridMetaFromGeometry } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { Feature, FeatureBbox, FeatureGeometry } from "@/types/generated/api.schemas";

import {
  useSyncGridDatasets,
  selectedFiltersViewAtom,
  useSyncBbox,
  useSyncLocation,
} from "@/app/store";

import GridFiltersItem from "./item";

proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:3857", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs");

export default function GridFilters() {
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);

  const [bbox] = useSyncBbox();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
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

  const { data: gridMetaData } = useGetGridMetaFromGeometry(
    feature,
    {},
    {
      select: (data) =>
        selectedFiltersView
          ? data.datasets.filter((dataset) => gridDatasets.includes(dataset.var_name))
          : data.datasets,
    },
  );

  return (
    <div className="space-y-1">
      {gridMetaData?.map((dataset) => <GridFiltersItem key={dataset.var_name} {...dataset} />)}
    </div>
  );
}
