import { TOPICS } from "@/constants/topics";

import WidgetMap from "@/containers/widgets/map";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";

export default function WidgetsProtection() {
  const T = TOPICS.find((t) => t.id === "protection");

  return (
    <div className="container">
      <h2 className="text-xl font-semibold mb-4">{T?.label}</h2>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <WidgetProtectedAreas />
        </div>

        <div className="col-span-6">
          <WidgetMap ids={["areas_protegidas"]} />
        </div>
      </div>
    </div>
  );
}
