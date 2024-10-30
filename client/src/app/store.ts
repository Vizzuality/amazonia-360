"use client";
import { atom } from "jotai";
import { useQueryState } from "nuqs";
import { createSerializer } from "nuqs/server";

import {
  bboxParser,
  gridDatasetsParser,
  gridFiltersParser,
  locationParser,
  topicsParser,
  indicatorsParser,
  datasetsParser,
} from "@/app/parsers";

import { SketchProps } from "@/components/map/sketch";

// URL PARAMS
export const useSyncBbox = () => {
  return useQueryState("bbox", bboxParser);
};

export const useSyncTopics = () => {
  return useQueryState("topics", topicsParser);
};

// TO - DO - this will be renamed to topics when contextual viewer is finished (replacing the other one)
export const useSyncIndicators = () => {
  return useQueryState("indicators", indicatorsParser);
};

export const useSyncDatasets = () => {
  return useQueryState("datasets", datasetsParser);
};

export const useSyncLocation = () => {
  return useQueryState("location", locationParser);
};

// GRID PARAMS
export const useSyncGridFilters = () => {
  return useQueryState("gridFilters", gridFiltersParser);
};

export const useSyncGridDatasets = () => {
  return useQueryState("gridDatasets", gridDatasetsParser);
};

const searchParams = {
  bbox: bboxParser,
  topics: topicsParser,
  location: locationParser,
};

const serialize = createSerializer(searchParams);

export const useSyncSearchParams = () => {
  const [bbox] = useSyncBbox();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();

  return serialize({ bbox, topics, location });
};

// JOTAI PARAMS
export const tmpBboxAtom = atom<__esri.Extent | undefined>(undefined);

export const sketchAtom = atom<SketchProps>({
  enabled: false,
  type: undefined,
});

export const tabAtom = atom<string>("contextual-viewer");
export const confirmAtom = atom<boolean>(false);
