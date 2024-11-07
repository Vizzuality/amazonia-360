import { GridstackItemComponent } from "@/lib/dynamic-grid/gridstack-item";

import { useSyncTopics } from "@/app/store";

// import { DATASETS } from "@/constants/datasets";
import {
  TOPICS,
  DEFAULT_VISUALIZATION_SIZES,
  MIN_VISUALIZATION_SIZES,
  TopicId,
} from "@/constants/topics";

import GridContainer from "@/containers/report/indicators/dashboard";
import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";
// import WidgetMap from "@/containers/widgets/map";

export default function TopicDashboard({ topicId }: { topicId: TopicId }) {
  const [topics] = useSyncTopics();
  const T = TOPICS?.find(({ id }) => id === topicId);

  const indicatorsByTopic = topics?.find(({ id }) => id === topicId)?.indicators;

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl font-semibold">{T?.label}</h2>
      <GridContainer id={topicId}>
        {indicatorsByTopic?.map(({ id, type, size }) => {
          return (
            <GridstackItemComponent
              gridId={topicId}
              key={`${id}-${type}`}
              id={`${id}-${type}`}
              initOptions={{
                autoPosition: true,
                w: size?.[0] || DEFAULT_VISUALIZATION_SIZES[type || "map"][0],
                h: size?.[1] || DEFAULT_VISUALIZATION_SIZES[type || "map"][1],
                minH: MIN_VISUALIZATION_SIZES[type || "map"][0],
                minW: MIN_VISUALIZATION_SIZES[type || "map"][1],
              }}
            >
              {/* TO - DO - type properly when we get real Indicators */}
              {/* {type === "map" && !!DATASETS?.[id as keyof typeof DATASETS] && (
                <WidgetMap ids={[id as keyof typeof DATASETS]} />
              )} */}
              {type === "chart" && <WidgetFundingByType />}
              {type === "numeric" && <WidgetTotalOperations />}
            </GridstackItemComponent>
          );
        })}
      </GridContainer>
    </div>
  );
}
