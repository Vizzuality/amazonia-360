import WidgetIndigenousLandCoverage from "@/containers/widgets/demographic-and-socioeconomic/indigenous-land";
import WidgetMap from "@/containers/widgets/map";
import WidgetPopulation from "@/containers/widgets/overview/population";

export default function WidgetsDemographicAndSocieconomic() {
  return (
    <div className="container">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6 grid grid-cols-12 gap-2">
          <div className="col-span-6">
            <WidgetIndigenousLandCoverage />
          </div>
          <div className="col-span-6">
            <WidgetPopulation />
          </div>
        </div>
        <div className="col-span-6">
          <WidgetMap ids={["tierras_indigenas"]} />
        </div>
      </div>
    </div>
  );
}
