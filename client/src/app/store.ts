"use client";
import { atom } from "jotai";
import { useQueryState } from "nuqs";
import { createSerializer } from "nuqs/server";

import {
  bboxParser,
  gridDatasetSelectedParser,
  gridDatasetsParser,
  gridFiltersParser,
  gridFiltersSetUpParser,
  locationParser,
  topicsParser,
  aiSummaryParser,
} from "@/app/parsers";

import { SketchProps } from "@/components/map/sketch";

// URL PARAMS
export const useSyncBbox = () => {
  return useQueryState("bbox", bboxParser);
};

export const useSyncTopics = () => {
  return useQueryState("topics", topicsParser);
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

export const useSyncGridSelectedDataset = () => {
  return useQueryState("gridDatasetSelected", gridDatasetSelectedParser);
};

export const useSyncGridFiltersSetUp = () => {
  return useQueryState("gridFiltersSetUp", gridFiltersSetUpParser);
};

// AI SUMMARY PARAMS
export const useSyncAiSummary = () => {
  return useQueryState("aiSummary", aiSummaryParser);
};

const searchParams = {
  bbox: bboxParser,
  topics: topicsParser,
  location: locationParser,
  gridFiltersSetUp: gridFiltersSetUpParser,
};

const serialize = createSerializer(searchParams);

export const useSyncSearchParams = () => {
  const [bbox] = useSyncBbox();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();
  const [gridFiltersSetUp] = useSyncGridFiltersSetUp();

  return serialize({ bbox, topics, location, gridFiltersSetUp });
};

// JOTAI PARAMS
export const indicatorsEditionModeAtom = atom<{ [key: string]: boolean }>({});
export const reportEditionModeAtom = atom<boolean>(false);

export const tmpBboxAtom = atom<__esri.Extent | undefined>(undefined);

export const sketchAtom = atom<SketchProps>({
  enabled: false,
  type: undefined,
});
export const sketchActionAtom = atom<{
  type?: "create" | "update" | "delete";
  state?: "start" | "active" | "complete" | "cancel";
  geometryType?: __esri.Geometry["type"];
}>({});

export const tabAtom = atom<"contextual-viewer" | "grid">("contextual-viewer");
export const reportPanelAtom = atom<"location" | "topics">("location");
export const gridPanelAtom = atom<"filters" | "table">("filters");
export const gridCellHighlightAtom = atom<{ id: number | null; index: string | undefined }>({
  id: null,
  index: undefined,
});

export type GridHoverType = {
  id: number | null;
  cell: string | undefined;
  index: string | undefined;
  x: number | null;
  y: number | null;
  coordinates: number[] | undefined;
  values: {
    column: string;
    value: string | number;
  }[];
};

export const gridHoverAtom = atom<GridHoverType>({
  id: null,
  cell: undefined,
  index: undefined,
  x: null,
  y: null,
  values: [],
  coordinates: undefined,
});

export const selectedFiltersViewAtom = atom<boolean>(false);

export const generatingAIReportAtom = atom<boolean>(false);
