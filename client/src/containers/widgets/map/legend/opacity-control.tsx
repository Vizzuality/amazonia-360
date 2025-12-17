import { useMemo } from "react";

import { Indicator } from "@/types/indicator";

import { useSyncTopics, useSyncDefaultTopics } from "@/app/(frontend)/store";

import { handleMapIndicatorPropertyChange } from "@/containers/widgets/map/utils";
import { FALLBACK_WIDGET_DEFAULT_BASEMAP_ID } from "@/containers/widgets/map/utils";

import OpacityControl from "@/components/map/legend/controls/opacity";

const OpacityControlButton = ({ indicator }: { indicator: Omit<Indicator, "resource"> }) => {
  const { topics, setTopics } = useSyncTopics();
  const [defaultTopics, setDefaultTopics] = useSyncDefaultTopics();

  const { opacity } = useMemo(() => {
    const topicWithIndicator =
      defaultTopics?.find((topic) =>
        topic.indicators?.find((ind) => ind.indicator_id === indicator.id),
      ) ||
      topics?.find((topic) => topic.indicators?.find((ind) => ind.indicator_id === indicator.id));
    const indicatorConfig = topicWithIndicator?.indicators?.find(
      (ind) => ind.indicator_id === indicator.id,
    );
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
          defaultTopics ?? null,
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
