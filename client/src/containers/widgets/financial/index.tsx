import { TOPICS } from "@/constants/topics";

import WidgetsColumn from "@/containers/widgets/column";
import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
import WidgetIDBOperations from "@/containers/widgets/financial/idb-operations";
import WidgetTotalFunding from "@/containers/widgets/financial/total-funding";
import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsFinancial() {
  const T = TOPICS.find((t) => t.id === "financial");

  return (
    <div className="container print:break-before-page">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <WidgetsRow>
        <WidgetsColumn className="col-span-6 print:col-span-12">
          <WidgetsRow className="grid-cols-subgrid grow">
            <WidgetsColumn className="col-span-6 self-start">
              <WidgetTotalOperations />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-6 self-start">
              <WidgetTotalFunding />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12">
              <WidgetFundingByType />
            </WidgetsColumn>
          </WidgetsRow>
        </WidgetsColumn>
        <WidgetsColumn className="col-span-6 print:col-span-12">
          <WidgetIDBOperations />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
