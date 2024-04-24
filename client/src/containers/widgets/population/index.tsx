import { TOPICS } from "@/constants/topics";

import WidgetsColumn from "@/containers/widgets/column";
import WidgetsPopulationDeprivation from "@/containers/widgets/population/deprivation";
import WidgetsPopulationPopulation from "@/containers/widgets/population/population";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsPopulation() {
  const T = TOPICS.find((t) => t.id === "population");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn className="col-span-6 print:col-span-12">
          <WidgetsPopulationPopulation />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-6 print:col-span-12">
          <WidgetsPopulationDeprivation />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
