import { TOPICS } from "@/constants/topics";

import WidgetIDBOperations from "@/containers/widgets/financial/idb-operations";
import WidgetTotalFunding from "@/containers/widgets/financial/total-funding";
import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";

export default function WidgetsFinancial() {
  const T = TOPICS.find((t) => t.id === "financial");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6 grid grid-cols-12 gap-2">
          <div className="col-span-6">
            <WidgetTotalOperations />
          </div>
          <div className="col-span-6">
            <WidgetTotalFunding />
          </div>
        </div>
        <div className="col-span-6">
          <WidgetIDBOperations />
        </div>
      </div>
    </div>
  );
}
