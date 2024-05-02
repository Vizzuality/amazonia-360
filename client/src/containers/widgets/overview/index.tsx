import { Card } from "@/containers/card";
import WidgetsColumn from "@/containers/widgets/column";
import WidgetMap from "@/containers/widgets/map";
import WidgetAdministrativeBoundaries from "@/containers/widgets/overview/administrative-boundaries";
import WidgetIndigenous from "@/containers/widgets/overview/indigenous-lands";
import WidgetPopulation from "@/containers/widgets/overview/population";
import WidgetProtection from "@/containers/widgets/overview/protection";
import WidgetTotalArea from "@/containers/widgets/overview/total-area";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsOverview() {
  return (
    <div className="container">
      <WidgetsRow>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetTotalArea />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetPopulation />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetProtection />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3 print:col-span-6">
          <WidgetIndigenous />
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 lg:col-span-6 print:col-span-12">
          <Card className="h-full p-0 relative">
            <WidgetMap
              ids={["ciudades_capitales"]}
              popup={{
                dockEnabled: true,
                dockOptions: {
                  buttonEnabled: false,
                  breakpoint: false,
                  position: "bottom-right",
                },
                visibleElements: {
                  featureNavigation: false,
                },
                viewModel: {
                  includeDefaultActions: false,
                  features: [],
                },
                collapseEnabled: false,
              }}
            />
          </Card>
        </WidgetsColumn>
        <WidgetsColumn className="col-span-12 lg:col-span-6 print:col-span-12 print:break-before-page">
          <WidgetAdministrativeBoundaries />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
