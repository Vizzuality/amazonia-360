export const FALLBACK_WIDGET_DEFAULT_BASEMAP_ID: BasemapIds = "gray-vector";
import { Indicator } from "@/app/local-api/indicators/route";
import {
  IndicatorView,
  DefaultTopicConfig,
  DefaultTopicIndicatorConfig,
  TopicView,
} from "@/app/parsers";

import { BasemapIds } from "@/components/map/controls/basemap";

export const handleBasemapChange = (
  selectedBasemapId: BasemapIds,
  overviewTopicsData: DefaultTopicConfig[] | null,
  indicator: Indicator,
  setSyncDefaultTopics: (
    callback: (prevDefaultTopics: DefaultTopicConfig[] | null) => DefaultTopicConfig[] | null,
  ) => void,
  setTopics: (callback: (prevTopicsState: TopicView[] | null) => TopicView[] | null) => void,
  defaultWidgetBasemapId: BasemapIds,
) => {
  const currentIndicatorTopicId = indicator.topic.id;

  // If the current indicator's topic is in overviewTopicsData, manage with setSyncDefaultTopics
  const isManagingViaSyncDefaultTopics = overviewTopicsData?.some(
    (topic) => currentIndicatorTopicId === topic.id,
  );

  if (isManagingViaSyncDefaultTopics) {
    setSyncDefaultTopics(
      (prevDefaultTopics: DefaultTopicConfig[] | null): DefaultTopicConfig[] | null => {
        const isResettingToDefault = selectedBasemapId === defaultWidgetBasemapId;

        const newTopicsArray: DefaultTopicConfig[] = prevDefaultTopics
          ? [...prevDefaultTopics]
          : [];

        const topicIndex = newTopicsArray.findIndex((t) => t.id === currentIndicatorTopicId);

        if (topicIndex !== -1) {
          // Topic already exists in syncDefaultTopics
          const targetTopic = { ...newTopicsArray[topicIndex] };
          const indicators: DefaultTopicIndicatorConfig[] = targetTopic.indicators
            ? [...targetTopic.indicators]
            : [];
          const indicatorConfigIndex = indicators.findIndex((i) => i.id === indicator.id);

          if (isResettingToDefault) {
            if (indicatorConfigIndex !== -1) {
              // Remove the specific indicator's basemap override
              indicators.splice(indicatorConfigIndex, 1);
            }
          } else {
            // Add or update the indicator's basemap override
            if (indicatorConfigIndex !== -1) {
              indicators[indicatorConfigIndex] = {
                ...indicators[indicatorConfigIndex],
                basemapId: selectedBasemapId,
              };
            } else {
              indicators.push({
                id: indicator.id,
                basemapId: selectedBasemapId,
              });
            }
          }

          if (indicators.length === 0) {
            // If the topic has no more indicator overrides, remove the topic itself
            newTopicsArray.splice(topicIndex, 1);
          } else {
            // Update the topic with the modified indicators list
            newTopicsArray[topicIndex] = {
              ...targetTopic,
              indicators,
            };
          }
        } else {
          // Topic does not exist in syncDefaultTopics yet
          if (!isResettingToDefault) {
            // Add new topic configuration only if not resetting to default
            newTopicsArray.push({
              id: currentIndicatorTopicId,
              indicators: [
                {
                  id: indicator.id,
                  basemapId: selectedBasemapId,
                },
              ],
            });
          }
        }
        return newTopicsArray.length > 0 ? newTopicsArray : null;
      },
    );
  } else {
    // Indicator's topic is not a default topic. Update syncTopics.
    setTopics((prevTopicsState: TopicView[] | null): TopicView[] | null => {
      const currentTopics = prevTopicsState || [];

      const topicIndex = currentTopics.findIndex((t) => t.id === indicator.topic.id);

      if (topicIndex === -1) {
        return prevTopicsState;
      }

      const topicToUpdate = currentTopics[topicIndex];
      const indicatorExists = (topicToUpdate.indicators || []).some(
        (ind: IndicatorView) => ind.id === indicator.id && ind.type === "map",
      );

      if (!indicatorExists) {
        return prevTopicsState;
      }

      // Topic and specific map indicator found. Proceed with the update.
      const newTopics = currentTopics.map((topic, index) => {
        if (index === topicIndex) {
          return {
            ...topic,
            indicators: (topic.indicators || []).map((ind) => {
              if (ind.id === indicator.id && ind.type === "map") {
                if (selectedBasemapId === defaultWidgetBasemapId) {
                  const updatedInd = { ...ind, basemapId: undefined };
                  return updatedInd;
                } else {
                  return { ...ind, basemapId: selectedBasemapId };
                }
              }
              return ind;
            }),
          };
        }
        return topic;
      });

      return newTopics.length > 0 ? newTopics : null;
    });
  }
};
