"use client";

import { useState } from "react";

import { useSyncTopics } from "@/app/store";

import { DatasetIds } from "@/constants/datasets";
import { DEFAULT_VISUALIZATION_SIZES, MIN_VISUALIZATION_SIZES, TOPICS } from "@/constants/topics";

import GridLayout from "@/containers/report/indicators/dashboard";
import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
// import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";
import WidgetMap from "@/containers/widgets/map";
import NumericWidget from "@/containers/widgets/numeric";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";

export default function ReportResultsContent() {
  const [topics] = useSyncTopics();
  const [isDraggable, setIsDraggable] = useState(false);
  const [isResizable, setIsResizable] = useState(false);

  const topicsDashboard = topics?.sort((a, b) => {
    if (!topics) return 0;
    const indexA = topics.findIndex((t) => t.id === a.id);
    const indexB = topics.findIndex((t) => t.id === b.id);
    return indexA - indexB;
  });

  const handleWidgetSettings = () => {
    setIsDraggable(!isDraggable);
    setIsResizable(!isResizable);
  };

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {/* TOPICS DASHBOARD */}

      {/* TO - DO - change topic dashboard (pass this to that component)*/}

      <div>
        {topicsDashboard?.map((topic) => {
          const selectedTopic = TOPICS.find((t) => t.id === topic.id);
          return (
            <div key={topic.id} className="container relative print:break-before-page">
              <h2 className="mb-4 text-xl font-semibold">{selectedTopic?.label}</h2>
              <GridLayout
                className="layout"
                isDraggable={isDraggable}
                isResizable={isResizable}
                style={{ pointerEvents: "all" }}
                // layout={generateLayout(topic)}
                rowHeight={122}
              >
                {topic.indicators.map(({ type, id }) => {
                  const [w, h] = DEFAULT_VISUALIZATION_SIZES[type];

                  return (
                    <div
                      key={`${topic.id}-${id}-${type}`}
                      data-grid={{
                        x: 0,
                        y: 0,
                        w,
                        h,
                        minW: MIN_VISUALIZATION_SIZES[type][0],
                        minH: MIN_VISUALIZATION_SIZES[type][1],
                      }}
                    >
                      {type === "map" && (
                        <WidgetMap ids={["fires"]} handleWidgetSettings={handleWidgetSettings} />
                      )}
                      {type === "chart" && <WidgetFundingByType />}
                      {type === "numeric" && <NumericWidget id={id as DatasetIds} />}
                      {type === "table" && <WidgetProtectedAreas />}
                    </div>
                  );
                })}
              </GridLayout>
            </div>
          );
        })}
      </div>

      {/* OTHER RESOURCES */}
      <WidgetsOtherResources />
    </div>
  );
}
