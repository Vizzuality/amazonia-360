import { TOPICS } from "@/constants/topics";

import WidgetsPopulationDeprivation from "@/containers/widgets/population/deprivation";
import WidgetsPopulationPopulation from "@/containers/widgets/population/population";

export default function WidgetsPopulation() {
  const T = TOPICS.find((t) => t.id === "population");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetsPopulationPopulation />
        </div>
        <div className="col-span-6">
          <WidgetsPopulationDeprivation />
        </div>
      </div>
    </div>
  );
}
