import type { Payload } from "payload";

import { mapDefaultVisualization } from "./utils/normalize-data";
import type { RawSubtopic, RawTopic, RawVisualizationEntry } from "./utils/types";

const patchDefaultVisualizations = async <
  TRaw extends { id: number; default_visualization: RawVisualizationEntry[] },
>(
  payload: Payload,
  collection: "topics" | "subtopics",
  rawItems: TRaw[],
): Promise<void> => {
  for (const raw of rawItems) {
    const id = String(raw.id);
    const exists = await payload.findByID({ collection, id, disableErrors: true, select: {} });
    if (!exists) continue;

    const indicatorIds = new Set<string>();
    for (const entry of raw.default_visualization) {
      const indicatorId = String(entry.indicator_id);
      if (indicatorIds.has(indicatorId)) continue;

      const indicatorExists = await payload.findByID({
        collection: "indicators",
        id: indicatorId,
        disableErrors: true,
        select: {},
      });
      if (indicatorExists) indicatorIds.add(indicatorId);
    }

    const { mapped: default_visualization, droppedIndicatorIds } = mapDefaultVisualization(
      raw.default_visualization,
      indicatorIds,
    );
    droppedIndicatorIds.forEach((droppedId) =>
      payload.logger.warn(
        `default_visualization entry dropped: indicator ${droppedId} does not exist`,
      ),
    );
    if (default_visualization.length > 0) {
      await payload.update({ collection, id, data: { default_visualization } });
    }
  }
};

export const seedDefaultVisualizations = async (
  payload: Payload,
  rawTopics: RawTopic[],
  rawSubtopics: RawSubtopic[],
): Promise<void> => {
  await patchDefaultVisualizations(payload, "topics", rawTopics);
  await patchDefaultVisualizations(payload, "subtopics", rawSubtopics);
};
