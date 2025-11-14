export const FALLBACK_WIDGET_DEFAULT_BASEMAP_ID: BasemapIds = "gray-vector";
import { Dispatch, SetStateAction } from "react";

import { omit } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import { IndicatorMapView, IndicatorView, TopicView } from "@/app/(frontend)/parsers";

import { BasemapIds } from "@/constants/basemaps";

type MapIndicatorProperties = "basemapId" | "opacity";

export const handleMapIndicatorPropertyChange = (
  propertyName: MapIndicatorProperties,
  propertyValue: BasemapIds | number,
  overviewTopicsData: TopicView[] | null,
  indicator: Indicator,
  setDefaultTopics: (
    callback: (prevDefaultTopics: TopicView[] | null) => TopicView[] | null,
  ) => void,
  setTopics: Dispatch<SetStateAction<TopicView[] | null | undefined>>,
  defaultValues: { basemapId: BasemapIds; opacity: number },
) => {
  const currentIndicatorTopicId = indicator.topic.id;
  const defaultValue = defaultValues[propertyName];
  const isResettingToDefault = propertyValue === defaultValue;

  const isManagingViaSyncDefaultTopics = overviewTopicsData?.some(
    (topic) => currentIndicatorTopicId === topic.topic_id,
  );

  if (isManagingViaSyncDefaultTopics) {
    setDefaultTopics((prevDefaultTopics) => {
      const newTopicsArray = prevDefaultTopics ? [...prevDefaultTopics] : [];
      const topicIndex = newTopicsArray.findIndex((t) => t.topic_id === currentIndicatorTopicId);

      if (topicIndex !== -1) {
        const targetTopic = { ...newTopicsArray[topicIndex] };
        const indicators = targetTopic.indicators ? [...targetTopic.indicators] : [];
        const indicatorConfigIndex = indicators.findIndex((i) => i.indicator_id === indicator.id);

        if (isResettingToDefault) {
          if (indicatorConfigIndex !== -1) {
            const indicatorConfig = { ...indicators[indicatorConfigIndex] } as IndicatorMapView;
            delete indicatorConfig[propertyName];

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...overrides } = indicatorConfig;
            if (Object.keys(overrides).length > 0) {
              indicators[indicatorConfigIndex] = indicatorConfig;
            } else {
              indicators.splice(indicatorConfigIndex, 1);
            }
          }
        } else {
          if (indicatorConfigIndex !== -1) {
            indicators[indicatorConfigIndex] = {
              ...indicators[indicatorConfigIndex],
              [propertyName]: propertyValue,
            };
          } else {
            indicators.push({
              id: `${indicator.id}`,
              indicator_id: indicator.id,
              type: "map",
              x: 0,
              y: 0,
              w: 2,
              h: 2,
              [propertyName]: propertyValue,
            });
          }
        }

        if (indicators.length === 0) {
          newTopicsArray.splice(topicIndex, 1);
        } else {
          newTopicsArray[topicIndex] = {
            ...targetTopic,
            indicators,
          };
        }
      } else if (!isResettingToDefault) {
        newTopicsArray.push({
          id: `${currentIndicatorTopicId}`,
          topic_id: currentIndicatorTopicId,
          indicators: [
            {
              id: `${indicator.id}`,
              indicator_id: indicator.id,
              x: 0,
              y: 0,
              w: 2,
              h: 2,
              type: "map",
              [propertyName]: propertyValue,
            },
          ],
        });
      }

      return newTopicsArray.length > 0 ? newTopicsArray : null;
    });
  } else {
    setTopics((prevTopicsState) => {
      const currentTopics = prevTopicsState || [];
      const topicIndex = currentTopics.findIndex((t) => t.topic_id === indicator.topic.id);

      if (topicIndex === -1) {
        return prevTopicsState;
      }

      const topicToUpdate = currentTopics[topicIndex];
      const indicatorExists = (topicToUpdate.indicators || []).some(
        (ind: IndicatorView) => ind.indicator_id === indicator.id && ind.type === "map",
      );

      if (!indicatorExists) {
        return prevTopicsState;
      }

      const newTopics = currentTopics.map((topic, index) => {
        if (index === topicIndex) {
          return {
            ...topic,
            indicators: (topic.indicators || []).map((ind) => {
              if (ind.indicator_id === indicator.id && ind.type === "map") {
                if (isResettingToDefault) {
                  return omit(ind, [propertyName as keyof typeof ind]);
                } else {
                  return { ...ind, [propertyName]: propertyValue };
                }
              }
              return ind;
            }),
          };
        }
        return topic;
      });

      return newTopics.length > 0 ? (newTopics as TopicView[]) : null;
    });
  }
};
