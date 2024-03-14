"use client";
import { atom } from "jotai";
import { useQueryState } from "nuqs";
import { createSerializer } from "nuqs/server";

import { bboxParser, datasetsParser, locationParser } from "@/app/parsers";

import { SketchProps } from "@/components/map/sketch";

// URL PARAMS
export const useSyncBbox = () => {
  return useQueryState("bbox", bboxParser);
};

export const useSyncDatasets = () => {
  return useQueryState("datasets", datasetsParser);
};

export const useSyncLocation = () => {
  return useQueryState("location", locationParser);
};

const searchParams = {
  bbox: bboxParser,
  datasets: datasetsParser,
  location: locationParser,
};

const serialize = createSerializer(searchParams);

export const useSyncSearchParams = () => {
  const [bbox] = useSyncBbox();
  const [datasets] = useSyncDatasets();
  const [location] = useSyncLocation();

  return serialize({ bbox, datasets, location });
};

// JOTAI PARAMS
export const tmpBboxAtom = atom<__esri.Extent | undefined>(undefined);

export const sketchAtom = atom<SketchProps>({
  enabled: false,
  type: undefined,
});
