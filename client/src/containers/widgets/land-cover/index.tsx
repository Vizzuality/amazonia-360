import WidgetLandCoverByType from "@/containers/widgets/land-cover/land-cover-by-type";
import WidgetMap from "@/containers/widgets/map";

export default function WidgetsLandCover() {
  return (
    <div className="container">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetLandCoverByType />
        </div>
        <div className="col-span-6">
          <WidgetMap ids={["tierras_indigenas"]} />
        </div>
      </div>
    </div>
  );
}
