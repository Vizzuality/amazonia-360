import { cn } from "@/lib/utils";

import { TOPICS } from "@/constants/topics";

import WidgetsColumn from "@/containers/widgets/column";
import WidgetAltitude from "@/containers/widgets/environment/altitude";
import WidgetBiomesByType from "@/containers/widgets/environment/biomes-by-type";
import WidgetLandCoverByType from "@/containers/widgets/environment/land-cover-by-type";
import WidgetsEnvironmentMap from "@/containers/widgets/environment/map";
import WidgetEnvironmentSummary from "@/containers/widgets/environment/summary";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsEnvironment({ index }: { index: number }) {
  const T = TOPICS.find((t) => t.id === "natural-physical-environment");

  return (
    <div className="container print:break-before-page">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn
          className={cn(
            "col-span-12 lg:col-span-6 print:col-span-12",
            index % 2 !== 0 && "lg:order-2",
          )}
        >
          <WidgetsRow>
            <WidgetsColumn className="col-span-12">
              <WidgetEnvironmentSummary />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12">
              <WidgetAltitude />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12 md:col-span-6 h-full flex flex-col">
              <WidgetBiomesByType />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12 md:col-span-6 h-full flex flex-col">
              <WidgetLandCoverByType />
            </WidgetsColumn>
          </WidgetsRow>
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 lg:col-span-6">
          <WidgetsEnvironmentMap />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
