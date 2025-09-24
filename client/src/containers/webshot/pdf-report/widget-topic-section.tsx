import { VisualizationTypes } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { TopicView } from "@/app/parsers";

import PdfHeader from "@/containers/header/pdf-header";
import ReportResultsIndicator from "@/containers/results/content/indicators/card";

import { WebshotReportContainer } from "../webshot-report-container";

interface WidgetTopicSectionProps {
  totalPages: number;
  getCurrentPage: (element?: HTMLElement) => number;
  documentHeight: number;
  topic?: Topic;
  topicView?: TopicView;
}

export default function WidgetTopicSection({
  totalPages,
  getCurrentPage,
  documentHeight,
  topic,
  topicView,
}: WidgetTopicSectionProps) {
  const indicators = topicView?.indicators;

  if (!indicators) return null;

  const WidgetTypeGridSize: Record<
    VisualizationTypes,
    { x: number; y: number; className: string }
  > = {
    map: { x: 2, y: 4, className: "col-span-2 row-span-4" },
    table: { x: 2, y: 4, className: "col-span-2 row-span-4" },
    chart: { x: 4, y: 2, className: "col-span-4 row-span-2" },
    numeric: { x: 1, y: 2, className: "col-span-1 row-span-2" },
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
      <WebshotReportContainer>
        <PdfHeader
          totalPages={totalPages}
          getCurrentPage={getCurrentPage}
          documentHeight={documentHeight}
          topic={topic?.name}
        />
        <div className="grid h-full grid-cols-4 grid-rows-4 gap-4 p-4">
          {indicatorsByType["numeric"]?.map((indicator) => (
            <div key={indicator.id} className={`${WidgetTypeGridSize["numeric"].className} h-full`}>
              <ReportResultsIndicator
                key={indicator.id}
                type={indicator.type}
                id={indicator.id}
                editable={false}
              />
            </div>
          ))}
        </div>
      </WebshotReportContainer>
      <WebshotReportContainer>
        <PdfHeader
          totalPages={totalPages}
          getCurrentPage={getCurrentPage}
          documentHeight={documentHeight}
          topic={topic?.name}
        />
        <div className="grid h-full grid-cols-4 grid-rows-4 gap-4 p-4">
          {indicatorsByType["chart"]?.map((indicator) => (
            <div key={indicator.id} className={`${WidgetTypeGridSize["chart"].className} h-full`}>
              <ReportResultsIndicator
                key={indicator.id}
                type={indicator.type}
                id={indicator.id}
                editable={false}
              />
            </div>
          ))}
        </div>
      </WebshotReportContainer>
      <WebshotReportContainer>
        <PdfHeader
          totalPages={totalPages}
          getCurrentPage={getCurrentPage}
          documentHeight={documentHeight}
          topic={topic?.name}
        />
        <div className="grid h-full grid-cols-4 grid-rows-4 gap-4 p-4">
          {indicatorsByType["map"]?.map((indicator) => (
            <div key={indicator.id} className={`${WidgetTypeGridSize["map"].className} h-full`}>
              <ReportResultsIndicator
                key={indicator.id}
                type={indicator.type}
                id={indicator.id}
                editable={false}
              />
            </div>
          ))}
        </div>
      </WebshotReportContainer>
      <WebshotReportContainer>
        <PdfHeader
          totalPages={totalPages}
          getCurrentPage={getCurrentPage}
          documentHeight={documentHeight}
          topic={topic?.name}
        />
        <div className="grid h-full grid-cols-4 grid-rows-4 gap-4 p-4">
          {indicatorsByType["table"]?.map((indicator) => (
            <div key={indicator.id} className={`${WidgetTypeGridSize["table"].className} h-full`}>
              <ReportResultsIndicator
                key={indicator.id}
                type={indicator.type}
                id={indicator.id}
                editable={false}
              />
            </div>
          ))}
        </div>
      </WebshotReportContainer>
    </>
  );
}
