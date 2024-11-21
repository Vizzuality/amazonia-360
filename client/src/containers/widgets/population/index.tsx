import { useGetTopics } from "@/lib/topics";

import WidgetsColumn from "@/containers/widgets/column";
import WidgetsPopulationDeprivation from "@/containers/widgets/population/deprivation";
import WidgetsPopulationPopulation from "@/containers/widgets/population/population";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsPopulation() {
  const { data: topicsData } = useGetTopics();
  const T = topicsData?.find((t) => t.id === "people");

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn className="col-span-12 md:col-span-6 print:col-span-12">
          <WidgetsPopulationPopulation />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 print:col-span-12">
          <WidgetsPopulationDeprivation />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
