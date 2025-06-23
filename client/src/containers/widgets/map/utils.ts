export const FALLBACK_WIDGET_DEFAULT_BASEMAP_ID: BasemapIds = "gray-vector";
import { omit } from "@/lib/utils";

import { Indicator } from "@/app/local-api/indicators/route";
import {
  IndicatorView,
  DefaultTopicConfig,
  DefaultTopicIndicatorConfig,
  TopicView,
} from "@/app/parsers";

import { BasemapIds } from "@/components/map/controls/basemap";

type MapIndicatorProperties = "basemapId" | "opacity";

export const handleMapIndicatorPropertyChange = (
  propertyName: MapIndicatorProperties,
  propertyValue: BasemapIds | number,
  overviewTopicsData: DefaultTopicConfig[] | null,
  indicator: Indicator,
  setSyncDefaultTopics: (
    callback: (prevDefaultTopics: DefaultTopicConfig[] | null) => DefaultTopicConfig[] | null,
  ) => void,
  setTopics: (callback: (prevTopicsState: TopicView[] | null) => TopicView[] | null) => void,
  defaultValues: { basemapId: BasemapIds; opacity: number },
) => {
  const currentIndicatorTopicId = indicator.topic.id;
  const defaultValue = defaultValues[propertyName];
  const isResettingToDefault = propertyValue === defaultValue;

  const isManagingViaSyncDefaultTopics = overviewTopicsData?.some(
    (topic) => currentIndicatorTopicId === topic.id,
  );

  if (isManagingViaSyncDefaultTopics) {
    setSyncDefaultTopics(
      (prevDefaultTopics: DefaultTopicConfig[] | null): DefaultTopicConfig[] | null => {
        const newTopicsArray: DefaultTopicConfig[] = prevDefaultTopics
          ? [...prevDefaultTopics]
          : [];
        const topicIndex = newTopicsArray.findIndex((t) => t.id === currentIndicatorTopicId);

        if (topicIndex !== -1) {
          const targetTopic = { ...newTopicsArray[topicIndex] };
          const indicators: DefaultTopicIndicatorConfig[] = targetTopic.indicators
            ? [...targetTopic.indicators]
            : [];
          const indicatorConfigIndex = indicators.findIndex((i) => i.id === indicator.id);

          if (isResettingToDefault) {
            if (indicatorConfigIndex !== -1) {
              const indicatorConfig = { ...indicators[indicatorConfigIndex] };
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
                id: indicator.id,
                [propertyName]: propertyValue,
              } as DefaultTopicIndicatorConfig);
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
            id: currentIndicatorTopicId,
            indicators: [
              {
                id: indicator.id,
                [propertyName]: propertyValue,
              } as DefaultTopicIndicatorConfig,
            ],
          });
        }

        return newTopicsArray.length > 0 ? newTopicsArray : null;
      },
    );
  } else {
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

      const newTopics = currentTopics.map((topic, index) => {
        if (index === topicIndex) {
          return {
            ...topic,
            indicators: (topic.indicators || []).map((ind) => {
              if (ind.id === indicator.id && ind.type === "map") {
                if (isResettingToDefault) {
                  return omit(ind, [propertyName]);
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

      return newTopics.length > 0 ? newTopics : null;
    });
  }
};
