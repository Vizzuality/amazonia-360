// import { DATASETS } from "@/constants/datasets";
import { GridStackOptions } from "gridstack";

import { GridstackGrid } from "@/lib/dynamic-grid/gridstack-grid";
import { GridstackItemComponent } from "@/lib/dynamic-grid/gridstack-item";
import { GridstackProvider } from "@/lib/dynamic-grid/gridstack-provider";

import { useSyncTopics } from "@/app/store";

import { DatasetIds } from "@/constants/datasets";
import {
  TOPICS,
  DEFAULT_VISUALIZATION_SIZES,
  MIN_VISUALIZATION_SIZES,
  TopicId,
} from "@/constants/topics";

import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
import WidgetMap from "@/containers/widgets/map";
import NumericWidget from "@/containers/widgets/numeric";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";

// import WidgetMap from "@/containers/widgets/map";

export default function TopicDashboard({ topicId }: { topicId: TopicId }) {
  const [topics] = useSyncTopics();
  const T = TOPICS?.find(({ id }) => id === topicId);

  const indicatorsByTopic = topics?.find(({ id }) => id === topicId)?.indicators;

  const gridOptions: GridStackOptions = {
    handle: ".handle",
    resizable: {
      handles: "e, se, s, sw, w",
      autoHide: false,
    },
    alwaysShowResizeHandle: true,
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
                  w: size?.[0] || DEFAULT_VISUALIZATION_SIZES[type || "map"][0],
                  h: size?.[1] || DEFAULT_VISUALIZATION_SIZES[type || "map"][1],
                  minH: MIN_VISUALIZATION_SIZES[type || "map"][0],
                  minW: MIN_VISUALIZATION_SIZES[type || "map"][1],
                }}
              >
                {type === "map" && <WidgetMap ids={["fires"]} />}
                {type === "chart" && <WidgetFundingByType />}
                {type === "numeric" && <NumericWidget id={id as DatasetIds} />}
                {type === "table" && <WidgetProtectedAreas />}
              </GridstackItemComponent>
            );
          })}
        </GridstackGrid>
      </div>
    </GridstackProvider>
  );
}
