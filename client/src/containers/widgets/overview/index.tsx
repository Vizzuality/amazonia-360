import { Card } from "@/containers/card";
import WidgetsColumn from "@/containers/widgets/column";
import WidgetMap from "@/containers/widgets/map";
import WidgetAdministrativeBoundaries from "@/containers/widgets/overview/administrative-boundaries";
import WidgetAltitude from "@/containers/widgets/overview/altitude";
import WidgetAmazoniaCoverage from "@/containers/widgets/overview/amazonia-coverage";
import WidgetPopulation from "@/containers/widgets/overview/population";
import WidgetTotalArea from "@/containers/widgets/overview/total-area";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsOverview() {
  return (
    <div className="container">
      <WidgetsRow>
        <WidgetsColumn className="col-span-3 print:col-span-6">
          <WidgetTotalArea />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-3 print:col-span-6">
          <WidgetPopulation />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-3 print:col-span-6">
          <WidgetAltitude />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-3 print:col-span-6">
          <WidgetAmazoniaCoverage />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-6 print:col-span-12">
          <Card className="h-full p-0 relative">
            <WidgetMap ids={["ciudades_capitales"]} />
          </Card>
        </WidgetsColumn>
        <WidgetsColumn className="col-span-6 print:col-span-12 print:break-before-page">
          <WidgetAdministrativeBoundaries />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
