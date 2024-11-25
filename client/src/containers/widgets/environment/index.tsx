// import { GridstackItemComponent } from "@/lib/dynamic-grid/gridstack-item";

// import { useSyncIndicators } from "@/app/store";

import { useGetTopics } from "@/lib/topics";

// import GridContainer from "@/containers/report/indicators/dashboard";
// import WidgetLandCoverByType from "@/containers/widgets/environment/land-cover-by-type";
// import WidgetsEnvironmentMap from "@/containers/widgets/environment/map";

export default function WidgetsEnvironment() {
  // const [indicators] = useSyncIndicators();
  const { data: topicsData } = useGetTopics();
  const T = topicsData?.find(({ id }) => id === 1);

  // const indicatorsByTopic = indicators?.find(
  //   ({ id }) => id === "natural-physical-environment",
  // )?.indicators;

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl">{T?.name}</h2>
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
              {type === "map" && <WidgetsEnvironmentMap />}
              {type === "chart" && <WidgetsEnvironmentMap />}
              {type === "numeric" && <WidgetsEnvironmentMap />}
            </GridstackItemComponent>
          );
        })}
      </GridContainer> */}
    </div>
  );
}
