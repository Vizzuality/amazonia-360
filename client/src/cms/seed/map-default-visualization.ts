import type { Topic } from "@/payload-types";

import { resolveFixedIndicatorId } from "./fixes";
import type { RawDefaultVisualization } from "./source";

export type DefaultVisualizationEntry = NonNullable<Topic["default_visualization"]>[number];

/**
 * Shared by Topics and Subtopics. `basemapId` and `opacity` are absent from the source, so
 * they are left unset and the field defaults (`gray-vector`, `1`) apply. An indicator that
 * cannot be resolved is collected in `skipped` rather than throwing, so one bad reference
 * does not abort the seed.
 */
export function mapDefaultVisualization(
  entries: RawDefaultVisualization[] | undefined,
  ownerLegacyId: number,
  indicatorIds: Map<number, string>,
): { entries: DefaultVisualizationEntry[]; skipped: number[] } {
  const mapped: DefaultVisualizationEntry[] = [];
  const skipped: number[] = [];

  for (const raw of entries ?? []) {
    const legacyId = resolveFixedIndicatorId(ownerLegacyId, raw.indicator_id);
    const indicator = indicatorIds.get(legacyId);

    if (!indicator) {
      skipped.push(legacyId);
      continue;
    }

    mapped.push({
      indicator,
      type: raw.type as DefaultVisualizationEntry["type"],
      x: raw.x,
      y: raw.y,
      w: raw.w,
      h: raw.h,
    });
  }

  return { entries: mapped, skipped };
}
