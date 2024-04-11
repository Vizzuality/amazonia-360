import { TOPICS } from "@/constants/topics";

import WidgetMap from "@/containers/widgets/map";
import WidgetLandCoverByType from "@/containers/widgets/natural-physical-environment/land-cover-by-type";

export default function WidgetsLandCover() {
  const T = TOPICS.find((t) => t.id === "natural-physical-environment");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetLandCoverByType />
        </div>
        <div className="col-span-6">
          <WidgetMap ids={["land_cover"]} />
        </div>
      </div>
    </div>
  );
}
