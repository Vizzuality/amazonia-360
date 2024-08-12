import { cn } from "@/lib/utils";

import { TOPICS } from "@/constants/topics";

import { Card } from "@/containers/card";
import WidgetResearchCenters from "@/containers/widgets/bioeconomy/research-centers";
import WidgetsColumn from "@/containers/widgets/column";
import WidgetMap from "@/containers/widgets/map";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsBioeconomy({ index }: { index: number }) {
  const T = TOPICS.find((t) => t.id === "bioeconomy");

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl font-semibold">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn
          className={cn(
            "col-span-12 lg:col-span-6 print:col-span-12",
            index % 2 !== 0 && "lg:order-2",
          )}
        >
          <WidgetResearchCenters />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 lg:col-span-6 print:col-span-12">
          <Card className="relative h-full p-0">
            <WidgetMap ids={["institutional_tracking"]} />
          </Card>
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
