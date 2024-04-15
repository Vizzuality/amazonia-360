import { TOPICS } from "@/constants/topics";

import WidgetEcosystemsByType from "@/containers/widgets/environment/ecosystems-by-type";
import WidgetLandCoverByType from "@/containers/widgets/environment/land-cover-by-type";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsEnvironment() {
  const T = TOPICS.find((t) => t.id === "natural-physical-environment");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6 grid grid-cols-12 gap-2 items-stretch">
          <div className="col-span-6 h-full flex flex-col">
            <WidgetEcosystemsByType />
          </div>
          <div className="col-span-6 h-full flex flex-col">
            <WidgetLandCoverByType />
          </div>
        </div>
        <div className="col-span-6">
          <WidgetMap ids={["land_cover"]} />
        </div>
      </div>
    </div>
  );
}
