"use client";

import { useRef } from "react";

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

export const locationAtom = atom<Location | null>(null);
export const useSyncLocation = () => {
  return useAtom(locationAtom);
};

// REPORT PARAMS
export const useFormTitle = () => {
  const form = useFormContext<ReportFormData>();
  const title = useWatch({ control: form.control, name: "title" });

  return {
    title: title as string | undefined | null,
    setTitle: (
      newTitle:
        | string
        | undefined
        | null
        | ((prev: string | undefined | null) => string | undefined | null),
    ) => {
      const nextTitle =
        typeof newTitle === "function" ? newTitle(title as string | undefined | null) : newTitle;
      form.setValue("title", nextTitle as ReportFormData["title"]);
    },
  };
};

export const useFormLocation = () => {
  const form = useFormContext<ReportFormData>();
  const location = useWatch({ control: form.control, name: "location" });

  return {
    location: location as Location | undefined | null,
    setLocation: (
      newLocation:
        | Location
        | undefined
        | null
        | ((prev: Location | undefined | null) => Location | undefined | null),
    ) => {
      const nextLocation =
        typeof newLocation === "function"
          ? newLocation(location as Location | undefined | null)
          : newLocation;
      form.setValue("location", nextLocation as ReportFormData["location"]);
    },
  };
};

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

export const useReportFormChanged = (): boolean => {
  const form = useFormContext<ReportFormData>();
  const intialState = useRef(form.formState.defaultValues);

  if (form.formState.isReady) {
    intialState.current = form.formState.defaultValues;
    return JSON.stringify(intialState.current) !== JSON.stringify(form.getValues());
  }

  return false;
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

// JOTAI ATOMS
export const indicatorsEditionModeAtom = atom<{ [key: string]: boolean }>({});
export const reportEditionModeAtom = atom<boolean>(false);

export const tmpBboxAtom = atom<__esri.Extent | undefined>(undefined);

// SKETCH ATOMS
export const sketchAtom = atom<SketchProps>({
  enabled: undefined,
  type: undefined,
});
export const sketchActionAtom = atom<{
  type?: "create" | "update" | "delete";
  state?: "start" | "active" | "complete" | "cancel";
  geometryType?: __esri.Geometry["type"];
}>({});

// CREATE REPORT ATOMS
export const reportPanelAtom = atom<"location" | "topics">("location");

// GRID ATOMS
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
export const gridSelectedFiltersViewAtom = atom<boolean>(false);

// EXPAND INDICATORS ATOM
export const indicatorsExpandAtom = atom<Record<number, number[] | undefined> | undefined>({});

// PDF ATOMS
export const pdfIndicatorsMapStateAtom = atom<
  {
    id: `${Indicator["id"]}-${VisualizationTypes | "custom"}`;
    enabled?: boolean;
    status: "loading" | "ready";
  }[]
>([]);
