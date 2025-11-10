"use client";

import { useParams } from "next/navigation";

import { atom } from "jotai";
import { useQueryState } from "nuqs";
import { useLocalStorage } from "usehooks-ts";

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
  AiSummary,
} from "@/app/(frontend)/parsers";

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
export const useSyncTitle = () => {
  const { id } = useParams();
  return useLocalStorage<string | null>(`${id ?? "new"}:title`, null);
};

export const useSyncLocation = () => {
  const { id } = useParams();
  return useLocalStorage<Location | null>(`${id ?? "new"}:location`, null);
};

export const useSyncTopics = () => {
  const { id } = useParams();
  return useLocalStorage<TopicView[] | null>(`${id ?? "new"}:topics`, null);
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

// AI SUMMARY PARAMS
export const useSyncAiSummary = () => {
  const { id } = useParams();
  return useLocalStorage<AiSummary>(`${id ?? "new"}:ai-summary`, {
    type: "Normal",
    only_active: true,
    enabled: false,
    generating: {},
  });
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
