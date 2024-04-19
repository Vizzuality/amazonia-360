import { TOPICS } from "@/constants/topics";

import { Card } from "@/containers/card";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsFinancial() {
  const T = TOPICS.find((t) => t.id === "financial");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <Card className="h-full p-0 relative">
            <WidgetMap ids={["tierras_indigenas"]} />
          </Card>
        </div>
      </div>
    </div>
  );
}
