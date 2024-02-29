"use client";

import { useQueryState } from "nuqs";
import { createSerializer } from "nuqs/server";

import { bboxParser, datasetsParser } from "@/app/parsers";

export const useSyncBbox = () => {
  return useQueryState("bbox", bboxParser);
};

export const useSyncDatasets = () => {
  return useQueryState("datasets", datasetsParser);
};

const searchParams = {
  bbox: bboxParser,
  datasets: datasetsParser,
};

const serialize = createSerializer(searchParams);

export const useSyncSearchParams = () => {
  const [bbox] = useSyncBbox();
  const [datasets] = useSyncDatasets();

  return serialize({ bbox, datasets });
};
