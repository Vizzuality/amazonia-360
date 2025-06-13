import { Indicator } from "@/app/local-api/indicators/route";
import { Topic } from "@/app/local-api/topics/route";
import {
  DefaultTopicConfig,
  DefaultTopicIndicatorConfig,
  IndicatorView as ParsedIndicatorView,
  TopicView,
} from "@/app/parsers";

import { BasemapIds } from "@/components/map/controls/basemap";

// Helper to get the original structure of an indicator from overview data
const getOriginalIndicatorView = (
  indicatorId: number,
  allOverviewTopics: Topic[] | undefined,
): ParsedIndicatorView | undefined => {
  if (!allOverviewTopics) return undefined;
  for (const topic of allOverviewTopics) {
    const foundIndicator = topic.default_visualization?.find(
      (ind: ParsedIndicatorView) => ind.id === indicatorId,
    );
    if (foundIndicator) return { ...foundIndicator }; // Return a copy
  }
  return undefined;
};

// Helper to update basemap for an indicator in a list of Topic indicators
const updateTopicIndicatorBasemap = (
  currentIndicators: ParsedIndicatorView[] | undefined,
  indicatorId: number,
  newBasemapId: BasemapIds | undefined,
  originalIndicatorGetter: () => ParsedIndicatorView | undefined,
): ParsedIndicatorView[] => {
  const indicators = currentIndicators ? currentIndicators.map((ind) => ({ ...ind })) : []; // Clone array and its items
  const indicatorIndex = indicators.findIndex((ind: ParsedIndicatorView) => ind.id === indicatorId);

  if (indicatorIndex !== -1) {
    // Indicator exists, update or remove basemapId
    if (newBasemapId) {
      indicators[indicatorIndex].basemapId = newBasemapId;
    } else {
      delete indicators[indicatorIndex].basemapId;
    }
  } else if (newBasemapId) {
    // Indicator doesn't exist, add it if original structure is found
    const originalIndicator = originalIndicatorGetter();
    if (originalIndicator) {
      indicators.push({ ...originalIndicator, basemapId: newBasemapId });
    }
  }
  return indicators;
};

// Helper to update basemap for an indicator in a list of DefaultTopicIndicatorConfig
const updateDefaultTopicIndicatorBasemap = (
  currentIndicators: DefaultTopicIndicatorConfig[],
  indicatorId: number,
  newBasemapId: BasemapIds | undefined,
): DefaultTopicIndicatorConfig[] => {
  const indicators = currentIndicators.map((ind) => ({ ...ind }));
  const numericIndicatorId = Number(indicatorId);
  const indicatorIndex = indicators.findIndex(
    (ind: DefaultTopicIndicatorConfig) => ind.id === numericIndicatorId,
  );

  if (newBasemapId) {
    // Update or add basemap
    if (indicatorIndex !== -1) {
      indicators[indicatorIndex].basemapId = newBasemapId;
    } else {
      indicators.push({ id: numericIndicatorId, basemapId: newBasemapId });
    }
    return indicators;
  } else {
    // Basemap is reset (newBasemapId is undefined), remove indicator config
    if (indicatorIndex !== -1) {
      return indicators.filter((ind: DefaultTopicIndicatorConfig) => ind.id !== numericIndicatorId);
    }
    return indicators; // No change if not found and removing
  }
};

export const handleBasemapChange = (
  selectedBasemapId: BasemapIds,
  defaultBasemapId: BasemapIds, // This is the defaultBasemapId prop from WidgetMap
  indicator: Indicator,
  topics: TopicView[] | null | undefined,
  setTopics: (updater: (prevSyncTopicsNullable: TopicView[] | null) => TopicView[] | null) => void,
  overviewTopicsData: Topic[] | undefined,
  setSyncDefaultTopics: (
    updater: (
      prevDefaultTopicsNullable: DefaultTopicConfig[] | null,
    ) => DefaultTopicConfig[] | null,
  ) => void,
) => {
  const newBasemapIdForIndicator =
    selectedBasemapId === defaultBasemapId ? undefined : selectedBasemapId;
  const topicIdToUpdate = indicator.topic.id;
  const indicatorIdToUpdate = indicator.id;

  const isTopicInSyncTopics = topics?.find((t: TopicView) => t.id === topicIdToUpdate);

  if (isTopicInSyncTopics) {
    setTopics((prevSyncTopicsNullable): TopicView[] | null => {
      const prevSyncTopics = prevSyncTopicsNullable ?? [];
      // Ensure immutability: map to new array with new topic objects and new indicator arrays
      const workingListOfSyncTopics: TopicView[] = prevSyncTopics.map((topic) => ({
        ...topic,
        indicators: topic.indicators ? topic.indicators.map((ind) => ({ ...ind })) : [],
      }));

      const targetTopicInSync = workingListOfSyncTopics.find(
        (t: TopicView) => t.id === topicIdToUpdate,
      );

      if (targetTopicInSync) {
        // targetTopicInSync is a new object, its indicators array is also new
        targetTopicInSync.indicators = updateTopicIndicatorBasemap(
          targetTopicInSync.indicators,
          indicatorIdToUpdate,
          newBasemapIdForIndicator,
          () => getOriginalIndicatorView(indicatorIdToUpdate, overviewTopicsData),
        );
      } else if (newBasemapIdForIndicator) {
        // Topic not in sync, create it
        const overviewTopics = overviewTopicsData as Topic[] | undefined;
        const overviewTopicToCopy = overviewTopics?.find((ot) => ot.id === topicIdToUpdate);
        if (overviewTopicToCopy) {
          const newTopicForSync: TopicView = {
            id: overviewTopicToCopy.id,
            // Initialize with copies of default visualization indicators
            indicators: ((overviewTopicToCopy as Topic).default_visualization || []).map(
              (dvInd: ParsedIndicatorView) => ({ ...dvInd }),
            ),
          };
          // Update/add the specific indicator's basemap
          newTopicForSync.indicators = updateTopicIndicatorBasemap(
            newTopicForSync.indicators,
            indicatorIdToUpdate,
            newBasemapIdForIndicator,
            () => getOriginalIndicatorView(indicatorIdToUpdate, overviewTopicsData),
          );
          workingListOfSyncTopics.push(newTopicForSync);
        }
      }
      return workingListOfSyncTopics.length > 0 ? workingListOfSyncTopics : null;
    });
  } else {
    // Topic is not in syncTopics, check if it's a known default topic
    const isKnownDefaultTopic = overviewTopicsData?.some((ot: Topic) => ot.id === topicIdToUpdate);

    if (isKnownDefaultTopic) {
      setSyncDefaultTopics((prevDefaultTopicsNullable): DefaultTopicConfig[] | null => {
        const prevDefaultTopics = prevDefaultTopicsNullable ?? [];
        let workingListOfDefaultTopics: DefaultTopicConfig[] = JSON.parse(
          JSON.stringify(prevDefaultTopics),
        ); // Deep clone for safety

        const targetDefaultTopic = workingListOfDefaultTopics.find(
          (t: DefaultTopicConfig) => t.id === topicIdToUpdate,
        );

        if (newBasemapIdForIndicator) {
          if (targetDefaultTopic) {
            targetDefaultTopic.indicators = updateDefaultTopicIndicatorBasemap(
              targetDefaultTopic.indicators,
              indicatorIdToUpdate,
              newBasemapIdForIndicator,
            );
          } else {
            // Topic not found, add new topic and indicator
            workingListOfDefaultTopics.push({
              id: topicIdToUpdate,
              indicators: [
                { id: Number(indicatorIdToUpdate), basemapId: newBasemapIdForIndicator },
              ],
            });
          }
        } else {
          // Basemap is reset, remove indicator config
          if (targetDefaultTopic) {
            targetDefaultTopic.indicators = updateDefaultTopicIndicatorBasemap(
              targetDefaultTopic.indicators,
              indicatorIdToUpdate,
              undefined, // Explicitly pass undefined for removal
            );
            // If the topic now has no indicators, remove the topic itself from default sync
            if (targetDefaultTopic.indicators.length === 0) {
              workingListOfDefaultTopics = workingListOfDefaultTopics.filter(
                (t: DefaultTopicConfig) => t.id !== topicIdToUpdate,
              );
            }
          }
        }
        return workingListOfDefaultTopics.length > 0 ? workingListOfDefaultTopics : null;
      });
    }
  }
};
