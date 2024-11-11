import GridLayout from "react-grid-layout";

import { useSyncIndicators } from "@/app/store";

import {
  TOPICS,
  DEFAULT_VISUALIZATION_SIZES,
  MIN_VISUALIZATION_SIZES,
  TopicId,
} from "@/constants/topics";

import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";
import WidgetMap from "@/containers/widgets/map";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";
// import WidgetMap from "@/containers/widgets/map";

export default function TopicDashboard({ topicId }: { topicId: TopicId }) {
  const [indicators] = useSyncIndicators();

  const T = TOPICS?.find(({ id }) => id === topicId);
  const indicatorsByTopic = indicators?.find(({ id }) => id === topicId)?.indicators;

  return (
    <div className="container relative print:break-before-page">
      <h2 className="mb-4 text-xl font-semibold">{T?.label}</h2>
      <GridLayout
        className="layout"
        cols={4}
        rowHeight={122}
        width={1200}
        margin={[10, 10]}
        containerPadding={[0, 0]}
        isResizable={true}
        isDraggable={true}
      >
        {indicatorsByTopic?.map(({ id, type, size }) => {
          return (
            <div
              key={`${id}-${type}`}
              id={`${id}-${type}`}
              data-grid={{
                i: `${id}-${type}`,
                x: 0,
                y: 0,
                w: size[0] || DEFAULT_VISUALIZATION_SIZES[type][0],
                h: size[1] || DEFAULT_VISUALIZATION_SIZES[type][1],
                minW: MIN_VISUALIZATION_SIZES[type][0],
                minH: MIN_VISUALIZATION_SIZES[type][1],
              }}
            >
              {type === "map" && <WidgetMap ids={["fires"]} />}
              {type === "chart" && <WidgetFundingByType />}
              {type === "numeric" && <WidgetTotalOperations />}
              {type === "table" && <WidgetProtectedAreas />}
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
