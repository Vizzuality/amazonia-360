import WidgetMap from "@/containers/widgets/map";
import WidgetAltitude from "@/containers/widgets/overview/altitude";
import WidgetAmazoniaCoverage from "@/containers/widgets/overview/amazonia-coverage";
import WidgetLandmarks from "@/containers/widgets/overview/landmarks";
import WidgetPopulation from "@/containers/widgets/overview/population";
import WidgetTotalArea from "@/containers/widgets/overview/total-area";

export default function WidgetsOverview() {
  return (
    <div className="container">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <WidgetTotalArea />
        </div>
        <div className="col-span-3">
          <WidgetPopulation />
        </div>
        <div className="col-span-3">
          <WidgetAltitude />
        </div>
        <div className="col-span-3">
          <WidgetAmazoniaCoverage />
        </div>
        <div className="col-span-6">
          <WidgetMap ids={["ciudades_capitales", "areas_protegidas"]} />
        </div>
        <div className="col-span-6">
          <WidgetLandmarks />
        </div>
      </div>
    </div>
  );
}
