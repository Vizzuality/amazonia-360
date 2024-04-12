import { TOPICS } from "@/constants/topics";

import WidgetResearchCenters from "@/containers/widgets/bioeconomy/research-centers";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsBioeconomy() {
  const T = TOPICS.find((t) => t.id === "bioeconomy");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetMap ids={["institutional_tracking"]} />
        </div>
        <div className="col-span-6">
          <WidgetResearchCenters />
        </div>
      </div>
    </div>
  );
}