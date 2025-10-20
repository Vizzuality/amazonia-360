"use client";

import { VisualizationTypes } from "@/types/indicator";

import { TopicView } from "@/app/parsers";

import ReportResultsIndicator from "@/containers/results/content/indicators/card";
import PdfContainer from "@/containers/webshot/pdf-report/container";

interface PdfTopicSectionProps {
  topicView?: TopicView;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
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
    numeric: { x: 1, y: 2, className: "col-span-2 row-span-1" },
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
      {!!indicatorsByType["numeric"]?.length &&
        chunkArray(indicatorsByType["numeric"], 2 * 3).map((chunk, index) => (
          <PdfContainer key={index}>
            <div className="grid grow grid-cols-4 grid-rows-3 gap-4 p-4 px-14">
              {chunk.map((indicator) => (
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
        ))}

      {!!indicatorsByType["chart"]?.length &&
        chunkArray(indicatorsByType["chart"], 3).map((chunk, index) => (
          <PdfContainer key={index}>
            <div className="grid grow grid-cols-4 grid-rows-3 gap-4 p-4 px-14">
              {chunk.map((indicator) => (
                <div
                  key={indicator.id}
                  className={`${WidgetTypeGridSize["chart"].className} h-full`}
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
        ))}

      {!!indicatorsByType["map"]?.length &&
        chunkArray(indicatorsByType["map"], 2).map((chunk, index) => (
          <PdfContainer key={index}>
            <div className="grid grow grid-cols-4 grid-rows-4 gap-4 p-4 px-14">
              {chunk.map((indicator) => (
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
        ))}

      {!!indicatorsByType["table"]?.length &&
        chunkArray(indicatorsByType["table"], 2).map((chunk, index) => (
          <PdfContainer key={index}>
            <div className="grid grow grid-cols-4 grid-rows-4 gap-4 p-4 px-14">
              {chunk.map((indicator) => (
                <div
                  key={indicator.id}
                  className={`${WidgetTypeGridSize["table"].className} h-full`}
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
        ))}
    </>
  );
}
