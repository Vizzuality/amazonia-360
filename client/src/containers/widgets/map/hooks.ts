import { useMemo } from "react";

import { Indicator } from "@/app/local-api/indicators/route";
import {
  DefaultTopicConfig,
  DefaultTopicIndicatorConfig,
  IndicatorView as ParsedIndicatorView,
  TopicView,
} from "@/app/parsers";

import { BasemapIds, BASEMAPS } from "@/components/map/controls/basemap";

interface UseInitialBasemapIdProps {
  indicator: Indicator;
  topics: TopicView[] | null | undefined;
  syncDefaultTopics: DefaultTopicConfig[] | null | undefined;
  defaultBasemapId: BasemapIds;
}

export function useInitialBasemapId({
  indicator,
  topics,
  syncDefaultTopics,
  defaultBasemapId,
}: UseInitialBasemapIdProps): BasemapIds {
  const initialBasemapIdToUse = useMemo(() => {
    // Check syncTopics (from URL state)
    if (topics && topics.length > 0) {
      const currentTopicInSync = topics.find((topic: TopicView) => topic.id === indicator.topic.id);
      const currentIndicatorInSync = currentTopicInSync?.indicators?.find(
        (ind: ParsedIndicatorView) => ind.id === indicator.id,
      );
      if (
        currentIndicatorInSync?.basemapId &&
        BASEMAPS.some((b) => b.id === currentIndicatorInSync.basemapId)
      ) {
        return currentIndicatorInSync.basemapId;
      }
    }

    // Check syncDefaultTopics (from URL state for default topic overrides)
    if (syncDefaultTopics && syncDefaultTopics.length > 0) {
      const currentTopicInDefaultSync = syncDefaultTopics.find(
        (topic: DefaultTopicConfig) => topic.id === Number(indicator.topic.id),
      );
      const currentIndicatorInDefaultSync = currentTopicInDefaultSync?.indicators?.find(
        (ind: DefaultTopicIndicatorConfig) => ind.id === Number(indicator.id),
      );
      if (
        currentIndicatorInDefaultSync?.basemapId &&
        BASEMAPS.some((b) => b.id === currentIndicatorInDefaultSync.basemapId)
      ) {
        return currentIndicatorInDefaultSync.basemapId;
      }
    }

    return defaultBasemapId;
  }, [topics, syncDefaultTopics, indicator.id, indicator.topic.id, defaultBasemapId]);

  return initialBasemapIdToUse;
}
