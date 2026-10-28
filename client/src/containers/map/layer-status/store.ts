import { atom } from "jotai";

import { Indicator } from "@/types/indicator";

import type { LayerViewStatus } from "@/components/map/layers/layer-view-status";

export type ExploreLayerStatus = "loading" | "ok" | "no_coverage" | "unavailable";

export const exploreLayerStatusesAtom = atom<Partial<Record<Indicator["id"], ExploreLayerStatus>>>(
  {},
);

/** Bumped by Try again; the layer remounts under the new value. */
export const exploreLayerAttemptsAtom = atom<Partial<Record<Indicator["id"], number>>>({});

/**
 * "empty" from the layer view means it will not draw at this scale, which says nothing about the
 * data in view. Only a feature count of zero does.
 */
export const getExploreLayerStatus = (
  status: LayerViewStatus,
  isEmptyInView: boolean,
): ExploreLayerStatus => {
  if (status === "loading") return "loading";
  if (status === "error") return "unavailable";
  if (isEmptyInView) return "no_coverage";
  return "ok";
};
