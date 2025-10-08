import { VisualizationTypes } from "@/types/indicator";

import { TopicView } from "@/app/parsers";

import ReportResultsIndicator from "@/containers/results/content/indicators/card";
import PdfContainer from "@/containers/webshot/pdf-report/container";

interface PdfTopicSectionProps {
  topicView?: TopicView;
}

export default function PdfTopicSection({ topicView }: PdfTopicSectionProps) {
  const indicators = topicView?.indicators;

  if (!indicators) return null;

  const WidgetTypeGridSize: Record<
    VisualizationTypes,
    { x: number; y: number; className: string }
  > = {
    map: { x: 2, y: 4, className: "col-span-2 row-span-4" },
    table: { x: 2, y: 4, className: "col-span-2 row-span-4" },
    chart: { x: 4, y: 2, className: "col-span-4 row-span-1" },
    numeric: { x: 1, y: 2, className: "col-span-1 row-span-1" },
    ai: { x: 2, y: 4, className: "col-span-2 row-span-4" },
  };

  const indicatorsByType: Record<VisualizationTypes, typeof indicators> = indicators.reduce(
    (acc, indicator) => {
      if (!acc[indicator.type]) {
        acc[indicator.type] = [];
      }
      acc[indicator.type].push(indicator);
      return acc;
    },
    {} as Record<VisualizationTypes, typeof indicators>,
  );

  return (
    <>
      {!!indicatorsByType["numeric"]?.length && (
        <PdfContainer>
          <div className="grid grow grid-cols-4 grid-rows-3 gap-4 p-4 px-14">
            {indicatorsByType["numeric"]?.map((indicator) => (
              <div
                key={indicator.id}
                className={`${WidgetTypeGridSize["numeric"].className} h-full shrink-0`}
              >
                <ReportResultsIndicator
                  key={indicator.id}
                  type={indicator.type}
                  id={indicator.id}
                  editable={false}
                  isPdf
                />
              </div>
            ))}
          </div>
        </PdfContainer>
      )}

      {!!indicatorsByType["chart"]?.length && (
        <PdfContainer>
          <div className="grid grow grid-cols-4 grid-rows-3 gap-4 p-4 px-14">
            {indicatorsByType["chart"]?.map((indicator) => (
              <div key={indicator.id} className={`${WidgetTypeGridSize["chart"].className} h-full`}>
                <ReportResultsIndicator
                  key={indicator.id}
                  type={indicator.type}
                  id={indicator.id}
                  editable={false}
                  isPdf
                />
              </div>
            ))}
          </div>
        </PdfContainer>
      )}

      {!!indicatorsByType["map"]?.length && (
        <PdfContainer>
          <div className="grid grow grid-cols-4 grid-rows-4 gap-4 p-4 px-14">
            {indicatorsByType["map"]?.map((indicator) => (
              <div key={indicator.id} className={`${WidgetTypeGridSize["map"].className} h-full`}>
                <ReportResultsIndicator
                  key={indicator.id}
                  type={indicator.type}
                  id={indicator.id}
                  editable={false}
                  isPdf
                />
              </div>
            ))}
          </div>
        </PdfContainer>
      )}

      {!!indicatorsByType["table"]?.length && (
        <PdfContainer>
          <div className="grid grow grid-cols-4 grid-rows-4 gap-4 p-4 px-14">
            {indicatorsByType["table"]?.map((indicator) => (
              <div key={indicator.id} className={`${WidgetTypeGridSize["table"].className} h-full`}>
                <ReportResultsIndicator
                  key={indicator.id}
                  type={indicator.type}
                  id={indicator.id}
                  editable={false}
                  isPdf
                />
              </div>
            ))}
          </div>
        </PdfContainer>
      )}
    </>
  );
}
