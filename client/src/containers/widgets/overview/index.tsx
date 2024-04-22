import { Card } from "@/containers/card";
import WidgetMap from "@/containers/widgets/map";
import WidgetAdministrativeBoundaries from "@/containers/widgets/overview/administrative-boundaries";
import WidgetAltitude from "@/containers/widgets/overview/altitude";
import WidgetAmazoniaCoverage from "@/containers/widgets/overview/amazonia-coverage";
import WidgetPopulation from "@/containers/widgets/overview/population";
import WidgetTotalArea from "@/containers/widgets/overview/total-area";

export default function WidgetsOverview() {
  return (
    <div className="container">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3 print:col-span-6">
          <WidgetTotalArea />
        </div>
        <div className="col-span-3 print:col-span-6">
          <WidgetPopulation />
        </div>
        <div className="col-span-3 print:col-span-6">
          <WidgetAltitude />
        </div>
        <div className="col-span-3 print:col-span-6">
          <WidgetAmazoniaCoverage />
        </div>
        <div className="col-span-6 print:col-span-12">
          <Card className="h-full p-0 relative">
            <WidgetMap ids={["ciudades_capitales"]} />
          </Card>
        </div>
        <div className="col-span-6 print:col-span-12 print:break-before-page">
          <WidgetAdministrativeBoundaries />
        </div>
      </div>
    </div>
  );
}
