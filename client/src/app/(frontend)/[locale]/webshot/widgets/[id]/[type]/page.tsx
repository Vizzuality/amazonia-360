import { VisualizationTypes } from "@/types/indicator";

import { PageProps } from "@/app/(frontend)/types";

import ReportResultsIndicator from "@/containers/results/content/indicators/card";
import Screenshot from "@/containers/webshot/widgets";
import WidgetContainer from "@/containers/webshot/widgets/container";

export default async function WebshotWidgets(
  props: PageProps<{ type: VisualizationTypes; id: string }>,
) {
  const { id, type } = await props.params;

  return (
    <Screenshot>
      <div className="p-8">
        <WidgetContainer type={type}>
          <ReportResultsIndicator type={type} id={parseInt(id)} editable={false} isWebshot />
        </WidgetContainer>
      </div>
    </Screenshot>
  );
}
