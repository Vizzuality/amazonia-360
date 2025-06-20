import { useMemo } from "react";
import { handleMapIndicatorPropertyChange } from "@/containers/widgets/map/utils";
import OpacityControl from "@/components/map/controls/opacity";
import { DefaultTopicConfig } from "@/app/parsers";
import { useGetOverviewTopics } from "@/lib/topics";
import { Indicator } from "@/app/local-api/indicators/route";
import { FALLBACK_WIDGET_DEFAULT_BASEMAP_ID } from "@/containers/widgets/map/utils";
import { useSyncTopics, useSyncDefaultTopics } from "@/app/store";
import { useLocale } from "next-intl";

const OpacityControlButton = ({ indicator }: {
  indicator: Omit<Indicator, "resource">;
}) => {
  const [topics, setTopics] = useSyncTopics();
  const [syncDefaultTopics, setSyncDefaultTopics] = useSyncDefaultTopics();


  const locale = useLocale();
  const { data: overviewTopicsData } = useGetOverviewTopics({ locale });
  const { opacity } = useMemo(() => {
    const topicWithIndicator =
      syncDefaultTopics?.find((topic) =>
        topic.indicators?.find((ind) => ind.id === indicator.id),
      ) ||
      topics?.find((topic) => topic.indicators?.find((ind) => ind.id === indicator.id));
    const indicatorConfig = topicWithIndicator?.indicators?.find((ind) => ind.id === indicator.id);
    return {
      opacity: indicatorConfig && "opacity" in indicatorConfig ? indicatorConfig.opacity : 100,
    };
  }, [syncDefaultTopics, indicator.id, topics]);

  const DEFAULT_VALUES = { basemapId: FALLBACK_WIDGET_DEFAULT_BASEMAP_ID, opacity: 100 };

  return (
    <OpacityControl
      value={opacity ?? DEFAULT_VALUES.opacity}
      onValueChange={(value: number[]) =>
        handleMapIndicatorPropertyChange(
          "opacity",
          value[0],
          overviewTopicsData ? (overviewTopicsData as unknown as DefaultTopicConfig[]) : null,
          indicator as Indicator,
          setSyncDefaultTopics,
          setTopics,
          DEFAULT_VALUES,
        )
      }
    />
  );
};

export default OpacityControlButton;