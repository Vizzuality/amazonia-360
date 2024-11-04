import { GridstackItemComponent } from "@/lib/dynamic-grid/gridstack-item";

import { useSyncIndicators } from "@/app/store";

import { TOPICS } from "@/constants/topics";

import GridContainer from "@/containers/report/indicators/dashboard";
import WidgetLandCoverByType from "@/containers/widgets/environment/land-cover-by-type";
import WidgetsEnvironmentMap from "@/containers/widgets/environment/map";
import WidgetEnvironmentSummary from "@/containers/widgets/environment/summary";

export default function WidgetsEnvironment() {
  const [indicators] = useSyncIndicators();
  const T = TOPICS?.find(({ id }) => id === "natural-physical-environment");

  const indicatorsByTopic = indicators?.find(
    ({ id }) => id === "natural-physical-environment",
  )?.indicators;

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl font-semibold">{T?.label}</h2>
      <GridContainer>
        {indicatorsByTopic?.map(({ id, type, size }) => (
          <GridstackItemComponent
            key={`${id}-${type}`}
            id={`${id}-${type}`}
            initOptions={{ autoPosition: true, w: size[0], h: size[1] }}
          >
            {type === "map" && <WidgetsEnvironmentMap />}
            {type === "chart" && <WidgetEnvironmentSummary />}
            {type === "numeric" && <WidgetLandCoverByType />}
          </GridstackItemComponent>
        ))}
      </GridContainer>
    </div>
  );
}
