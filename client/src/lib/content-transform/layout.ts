import { isVisualizationType } from "./types";
import type { LayoutEntry } from "./types";

/**
 * Default-layout entries for a Topic or Subtopic.
 *
 * The source entries carry an `id` that duplicates `indicator_id` in every case;
 * it is dropped. Entries pointing at an Indicator that does not exist are
 * dropped too — Subtopic 26's layout references Indicator 55, which is not in
 * the catalogue, so it renders as nothing today.
 *
 * Cross-Topic references are deliberate and must survive: the overview Topic
 * pulls Indicators from other Topics, so an entry is only removed when its
 * Indicator is genuinely absent, never because it sits under a different Topic.
 */

type RawLayoutEntry = {
  id?: unknown;
  indicator_id?: unknown;
  type?: unknown;
  x?: unknown;
  y?: unknown;
  w?: unknown;
  h?: unknown;
};

export type DroppedLayoutEntry = {
  owner: string;
  indicatorId: number;
};

const num = (value: unknown): number => (typeof value === "number" ? value : Number(value) || 0);

export const toLayout = ({
  entries,
  knownIndicatorIds,
  owner,
  dropped,
}: {
  entries: unknown;
  knownIndicatorIds: ReadonlySet<number>;
  owner: string;
  dropped?: DroppedLayoutEntry[];
}): LayoutEntry[] => {
  if (!Array.isArray(entries)) return [];

  return entries.flatMap((raw) => {
    const entry = raw as RawLayoutEntry;
    const indicatorId = num(entry.indicator_id);

    if (!knownIndicatorIds.has(indicatorId)) {
      dropped?.push({ owner, indicatorId });
      return [];
    }

    if (!isVisualizationType(entry.type)) {
      // The CMS select field only accepts the known values, so an unknown one
      // would fail on load. Better to stop here than write a broken record.
      throw new Error(
        `${owner} layout entry for Indicator ${indicatorId} has an unknown visualization type: ${JSON.stringify(entry.type)}`,
      );
    }

    return [
      {
        indicatorId,
        type: entry.type,
        x: num(entry.x),
        y: num(entry.y),
        w: num(entry.w),
        h: num(entry.h),
      },
    ];
  });
};
