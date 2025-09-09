import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetOverviewTopics } from "@/lib/topics";

import { Indicator } from "@/types/indicator";

import { DefaultTopicConfig } from "@/app/parsers";
import { useSyncTopics, useSyncDefaultTopics } from "@/app/store";

import { handleMapIndicatorPropertyChange } from "@/containers/widgets/map/utils";
import { FALLBACK_WIDGET_DEFAULT_BASEMAP_ID } from "@/containers/widgets/map/utils";

import OpacityControl from "@/components/map/legend/controls/opacity";

const OpacityControlButton = ({ indicator }: { indicator: Omit<Indicator, "resource"> }) => {
  const [topics, setTopics] = useSyncTopics();
  const [defaultTopics, setDefaultTopics] = useSyncDefaultTopics();

  const locale = useLocale();
  const { data: overviewTopicsData } = useGetOverviewTopics({ locale });
  const { opacity } = useMemo(() => {
    const topicWithIndicator =
      defaultTopics?.find((topic) => topic.indicators?.find((ind) => ind.id === indicator.id)) ||
      topics?.find((topic) => topic.indicators?.find((ind) => ind.id === indicator.id));
    const indicatorConfig = topicWithIndicator?.indicators?.find((ind) => ind.id === indicator.id);
    return {
      opacity: indicatorConfig && "opacity" in indicatorConfig ? indicatorConfig.opacity : 1,
    };
  }, [defaultTopics, indicator.id, topics]);

  const DEFAULT_VALUES = { basemapId: FALLBACK_WIDGET_DEFAULT_BASEMAP_ID, opacity: 1 };

  return (
    <OpacityControl
      value={opacity ?? DEFAULT_VALUES.opacity}
      onValueChange={(value: number[]) =>
        handleMapIndicatorPropertyChange(
          "opacity",
          value[0],
          overviewTopicsData ? (overviewTopicsData as unknown as DefaultTopicConfig[]) : null,
          indicator as Indicator,
          setDefaultTopics,
          setTopics,
          DEFAULT_VALUES,
        )
      }
    />
  );
};

export default OpacityControlButton;
