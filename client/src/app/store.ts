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
  defaultTopicsConfigParser,
  indicatorsParser,
  indicatorsSettingsParser,
} from "@/app/parsers";

import { SketchProps } from "@/components/map/sketch";

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

// URL PARAMS
export const useSyncBbox = () => {
  return useQueryState("bbox", bboxParser);
};

export const useSyncTopics = () => {
  return useQueryState("topics", topicsParser);
};

export const useSyncDefaultTopics = () => {
  return useQueryState("defaultTopics", defaultTopicsConfigParser);
};

export const useSyncIndicators = () => {
  return useQueryState("indicators", indicatorsParser);
};

export const useSyncIndicatorsSettings = () => {
  return useQueryState("indicatorsSettings", indicatorsSettingsParser);
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
};

const serialize = createSerializer(searchParams);

export const useSyncSearchParams = (ignore?: (keyof typeof searchParams)[]) => {
  const [bbox] = useSyncBbox();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();

  const params = { bbox, topics, location };
  if (ignore) {
    for (const key of ignore) {
      delete params[key];
    }
  }

  return serialize(params);
};

// JOTAI PARAMS
export const indicatorsEditionModeAtom = atom<{ [key: string]: boolean }>({});
export const reportEditionModeAtom = atom<boolean>(false);

export const tmpBboxAtom = atom<__esri.Extent | undefined>(undefined);

export const sketchAtom = atom<SketchProps>({
  enabled: undefined,
  type: undefined,
});
export const sketchActionAtom = atom<{
  type?: "create" | "update" | "delete";
  state?: "start" | "active" | "complete" | "cancel";
  geometryType?: __esri.Geometry["type"];
}>({});

export const reportPanelAtom = atom<"location" | "topics">("location");
export const gridPanelAtom = atom<"filters" | "table">("filters");
export const gridCellHighlightAtom = atom<{ id: number | null; index: string | undefined }>({
  id: null,
  index: undefined,
});

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

export const isGeneratingAIReportAtom = atom<Record<string, boolean>>();

export const generatedAITextAtom = atom<{ content: { id: number; description: string }[] }>({
  content: [],
});

export const setGeneratedAITextAtom = atom(
  null,
  (get, set, update: { id: number; description: string }) => {
    const prev = get(generatedAITextAtom);
    const idx = prev.content.findIndex((item) => item.id === update.id);

    const next =
      idx >= 0
        ? {
            content: prev.content.map((item, i) => (i === idx ? { ...item, ...update } : item)),
          }
        : {
            content: [...prev.content, update],
          };

    set(generatedAITextAtom, next);
  },
);

export const indicatorsExpandAtom = atom<Record<number, number[] | undefined> | undefined>({});
