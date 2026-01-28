"use client";

import { useRef } from "react";

import { useFormContext, useWatch } from "react-hook-form";

// import { useParams } from "next/navigation";

import { atom, useAtom } from "jotai";
import { useQueryState } from "nuqs";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import {
  bboxParser,
  // gridDatasetSelectedParser,
  // gridDatasetsParser,
  // gridDatasetSettingsParser,
  // gridTableSettingsParser,
  defaultTopicsConfigParser,
  // indicatorsParser,
  // indicatorsSettingsParser,
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

  if (form.formState.isReady && !!form.formState.defaultValues) {
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
  return useAtom(indicatorsAtom);
  // return useQueryState("indicators", indicatorsParser);
};

export const useSyncIndicatorsSettings = () => {
  return useAtom(indicatorsSettingsAtom);
  // return useQueryState("indicatorsSettings", indicatorsSettingsParser);
};

// GRID PARAMS
export const useSyncGridDatasetContinousSettings = () => {
  // const { id } = useParams();
  // const urlState = useQueryState("gridDatasetContinousSettings", gridDatasetSettingsParser);
  return useAtom(gridDatasetContinousSettingsAtom);
  // return !id ? urlState : atomState;
};

export const useSyncGridDatasetCategoricalSettings = () => {
  // const { id } = useParams();
  // const urlState = useQueryState("gridDatasetCategoricalSettings", gridDatasetSettingsParser);
  return useAtom(gridDatasetCategoricalSettingsAtom);
  // return !id ? urlState : atomState;
};

export const useSyncGridDatasets = () => {
  // const { id } = useParams();
  // const urlState = useQueryState("gridDatasets", gridDatasetsParser);
  return useAtom(gridDatasetsAtom);
  // return !id ? urlState : atomState;
};

export const useSyncGridSelectedDataset = () => {
  // const { id } = useParams();
  // const urlState = useQueryState("gridDatasetSelected", gridDatasetSelectedParser);
  return useAtom(gridSelectedDatasetAtom);
  // return !id ? urlState : atomState;
};

export const useSyncGridTableSettings = () => {
  // const { id } = useParams();
  // const urlState = useQueryState("gridTableSettings", gridTableSettingsParser);
  return useAtom(gridTableSettingsAtom);
  // return !id ? urlState : atomState;
};

// JOTAI ATOMS
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

// INDICATORS ATOMS
export const indicatorsAtom = atom<number[]>();
export const indicatorsSettingsAtom = atom<{
  [key: string]: {
    opacity?: number;
  };
}>({});

// GRID ATOMS
export const gridEnabledAtom = atom<boolean>(false);
export const gridPanelAtom = atom<"filters" | "table">("filters");
export const gridDatasetContinousSettingsAtom = atom<Record<string, number[] | undefined> | null>(
  null,
);

export const gridDatasetCategoricalSettingsAtom = atom<Record<string, number[] | undefined> | null>(
  null,
);

export const gridDatasetsAtom = atom<string[]>([]);

export const gridSelectedDatasetAtom = atom<string | null>(null);

export const gridTableSettingsAtom = atom<{
  [key: string]: number[] | number | string;
  limit: number;
  opacity: number;
  direction: "asc" | "desc";
}>({ limit: 10, opacity: 100, direction: "desc" });

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
