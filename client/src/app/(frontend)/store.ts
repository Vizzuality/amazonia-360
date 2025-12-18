"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { atom, useAtom } from "jotai";
import { useQueryState } from "nuqs";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import {
  bboxParser,
  gridDatasetSelectedParser,
  gridDatasetsParser,
  gridDatasetSettingsParser,
  gridTableSettingsParser,
  defaultTopicsConfigParser,
  indicatorsParser,
  indicatorsSettingsParser,
  Location,
  TopicView,
} from "@/app/(frontend)/parsers";

import { ReportFormData } from "@/containers/results";

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
// REPORT PARAMS
export const titleAtom = atom<string | undefined | null>(null);
export const useSyncTitle = () => {
  return useAtom(titleAtom);
};

export const locationAtom = atom<Location | null>(null);
export const useSyncLocation = () => {
  return useAtom(locationAtom);
};

export const topicsViewAtom = atom<TopicView[] | null | undefined>(null);
export const useFormTopics = () => {
  const form = useFormContext<ReportFormData>();
  const topics = useWatch({ control: form.control, name: "topics" });

  return {
    topics: topics as TopicView[],
    setTopics: (newTopics: TopicView[] | null | ((prev: TopicView[]) => TopicView[] | null)) => {
      const nextTopics =
        typeof newTopics === "function" ? newTopics(topics as TopicView[]) : newTopics;
      form.setValue("topics", nextTopics as ReportFormData["topics"]);
    },
  };
};

export const useSyncDefaultTopics = () => {
  return useQueryState("defaultTopics", defaultTopicsConfigParser);
};

// INDICATORS PARAMS
export const useSyncIndicators = () => {
  return useQueryState("indicators", indicatorsParser);
};

export const useSyncIndicatorsSettings = () => {
  return useQueryState("indicatorsSettings", indicatorsSettingsParser);
};

// GRID PARAMS
export const useSyncGridDatasetContinousSettings = () => {
  return useQueryState("gridDatasetContinousSettings", gridDatasetSettingsParser);
};

export const useSyncGridDatasetCategoricalSettings = () => {
  return useQueryState("gridDatasetCategoricalSettings", gridDatasetSettingsParser);
};

export const useSyncGridDatasets = () => {
  return useQueryState("gridDatasets", gridDatasetsParser);
};

export const useSyncGridSelectedDataset = () => {
  return useQueryState("gridDatasetSelected", gridDatasetSelectedParser);
};

export const useSyncGridTableSettings = () => {
  return useQueryState("gridTableSettings", gridTableSettingsParser);
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

// GRID PARAMS
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

export type ReportResultsTab = "indicators" | "ai_summaries";
export const resultsSidebarTabAtom = atom<ReportResultsTab>("indicators");

export const indicatorsExpandAtom = atom<Record<number, number[] | undefined> | undefined>({});

// PDF ATOMS
export const pdfIndicatorsMapStateAtom = atom<
  {
    id: `${Indicator["id"]}-${VisualizationTypes | "custom"}`;
    enabled?: boolean;
    status: "loading" | "ready";
  }[]
>([]);
