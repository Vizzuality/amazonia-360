"use client";

import { useQueryState } from "nuqs";

import { datasetsParser } from "@/app/parsers";

export const useSyncDatasets = () => {
  return useQueryState("datasets", datasetsParser);
};
