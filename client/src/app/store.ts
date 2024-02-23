"use client";

import { useQueryState } from "nuqs";

import { layersParser } from "@/app/parsers";

export const useSyncLayers = () => {
  return useQueryState("layers", layersParser);
};
