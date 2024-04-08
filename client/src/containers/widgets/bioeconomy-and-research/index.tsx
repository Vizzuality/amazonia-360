import WidgetResearchCenters from "@/containers/widgets/bioeconomy-and-research/research-centers";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsBioeconomicAndResearchData() {
  return (
    <div className="container">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetMap ids={["institutional_tracking"]} />
        </div>
        <div className="col-span-6">
          <WidgetResearchCenters />
        </div>
      </div>
    </div>
  );
}
