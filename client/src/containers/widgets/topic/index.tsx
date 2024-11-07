import { GridStackOptions } from "gridstack";

import { GridstackGrid } from "@/lib/dynamic-grid/gridstack-grid";
import { GridstackItemComponent } from "@/lib/dynamic-grid/gridstack-item";
import { GridstackProvider } from "@/lib/dynamic-grid/gridstack-provider";

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
// import WidgetMap from "@/containers/widgets/map";

export default function TopicDashboard({ topicId }: { topicId: TopicId }) {
  const [indicators] = useSyncIndicators();

  const T = TOPICS?.find(({ id }) => id === topicId);
  const indicatorsByTopic = indicators?.find(({ id }) => id === topicId)?.indicators;

  const gridOptions: GridStackOptions = {
    column: 4,
    cellHeight: "122px",
    minRow: 4,
    placeholderClass: "grid-stack-placeholder-custom",
  };

  return (
    <GridstackProvider>
      <div className="container relative print:break-before-page">
        <h2 className="mb-4 text-xl font-semibold">{T?.label}</h2>
        <GridstackGrid id={topicId} options={gridOptions}>
          {indicatorsByTopic?.map(({ id, type, size }) => {
            return (
              <GridstackItemComponent
                key={`${id}-${type}`}
                id={`${id}-${type}`}
                initOptions={{
                  autoPosition: true,
                  w: size[0] || DEFAULT_VISUALIZATION_SIZES[type][0],
                  h: size[1] || DEFAULT_VISUALIZATION_SIZES[type][1],
                  minH: MIN_VISUALIZATION_SIZES[type][0],
                  minW: MIN_VISUALIZATION_SIZES[type][1],
                }}
              >
                {type === "map" && <WidgetMap ids={["fires"]} />}
                {type === "chart" && <WidgetFundingByType />}
                {type === "numeric" && <WidgetTotalOperations />}
              </GridstackItemComponent>
            );
          })}
        </GridstackGrid>
      </div>
    </GridstackProvider>
  );
}
