import { TOPICS } from "@/constants/topics";

import WidgetMap from "@/containers/widgets/map";

export default function WidgetsPopulation() {
  const T = TOPICS.find((t) => t.id === "population");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetMap ids={["tierras_indigenas"]} />
        </div>
      </div>
    </div>
  );
}
