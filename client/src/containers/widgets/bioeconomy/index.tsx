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
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn
          className={cn(
            "col-span-6 print:col-span-12",
            index % 2 !== 0 && "order-2",
          )}
        >
          <WidgetResearchCenters />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-6 print:col-span-12">
          <Card className="h-full p-0 relative">
            <WidgetMap ids={["institutional_tracking"]} />
          </Card>
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
