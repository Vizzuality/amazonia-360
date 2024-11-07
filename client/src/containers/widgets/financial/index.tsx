// import { GridstackItemComponent } from "@/lib/dynamic-grid/gridstack-item";

// import { useSyncIndicators } from "@/app/store";

import {
  TOPICS,
  // DEFAULT_VISUALIZATION_SIZES, MIN_VISUALIZATION_SIZES
} from "@/constants/topics";

// import GridContainer from "@/containers/report/indicators/dashboard";
// import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
// import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";

export default function WidgetsFinancial() {
  const T = TOPICS.find((t) => t.id === "financial");

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl font-semibold">{T?.label}</h2>
      {/* <GridContainer>
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
              {type === "chart" && <WidgetTotalOperations />}
              {type === "numeric" && <WidgetTotalOperations />}
            </GridstackItemComponent>
          );
        })}
      </GridContainer> */}
    </div>
  );
}
