import { VisualizationTypes } from "@/types/indicator";

import { PageProps } from "@/app/types";

import ReportResultsIndicator from "@/containers/results/content/indicators/card";
import { WebshotWidgetContainer } from "@/containers/webshot/webshot-widget-container";

export default async function WebshotWidgets(
  props: PageProps<{ type: VisualizationTypes; id: string }>,
) {
  const { id, type } = await props.params;

  return (
    <main className="">
      <div className="p-8">
        <WebshotWidgetContainer type={type}>
          <ReportResultsIndicator type={type} id={parseInt(id)} editable={false} isWebshot />
        </WebshotWidgetContainer>
      </div>
    </main>
  );
}
