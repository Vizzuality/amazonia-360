"use client";

import { useCallback } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom } from "jotai";

import { useGetTopics } from "@/lib/topics";

import { Topics, TopicsParsed } from "@/app/parsers";
import { indicatorsEditionModeAtom, reportEditionModeAtom, useSyncTopics } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import DeleteHandler from "@/containers/report/indicators/controls/delete";
import MoveHandler from "@/containers/report/indicators/controls/drag";
import ResizeHandler from "@/containers/report/indicators/controls/resize";
import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
// import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";
import WidgetMap from "@/containers/widgets/map";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
import WidgetIndigenousLands from "@/containers/widgets/protection/indigenous-lands";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";

import { VisualizationType } from "../../visualization-types/types";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface IndicatorData {
  type: VisualizationType;
  id: string | number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ReportResultsContent() {
  const [topics, setTopics] = useSyncTopics();
  const [editionModeIndicator, setEditionModeIndicator] = useAtom(indicatorsEditionModeAtom);
  const [reportEditionMode] = useAtom(reportEditionModeAtom);

  const { data: topicsData, isLoading: isLoadingTopicsData } = useGetTopics();

  const topicsDashboard = topics?.sort((a, b) => {
    if (!topics) return 0;
    const indexA = topics.findIndex((t) => t.id === a.id);
    const indexB = topics.findIndex((t) => t.id === b.id);
    return indexA - indexB;
  });

  const handleDrop = useCallback(
    (layout: Layout[]) => {
      if (!layout) return;

      // Initialize `acc` with an empty object as `TopicsParsed`
      const indicatorsPosition = layout.reduce((acc, l) => {
        const { topic, indicator, type } = JSON.parse(l.i);
        const indicatorData: IndicatorData = {
          type,
          id: indicator,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
        };

        if (!acc.id) {
          acc.id = topic as TopicsParsed["id"];
          acc.indicators = [];
        }

        acc.indicators?.push(indicatorData);

        return acc;
      }, {} as TopicsParsed);

      setTopics((prev) => {
        const currentTopics = prev ?? [];

        const validIndicatorsPosition = {
          ...indicatorsPosition,
          indicators: indicatorsPosition.indicators ?? [],
        } as Topics;

        const topicIndex = currentTopics.findIndex((t) => t.id === validIndicatorsPosition.id);

        let updatedTopics;
        if (topicIndex !== -1) {
          updatedTopics = [
            ...currentTopics.slice(0, topicIndex),
            validIndicatorsPosition,
            ...currentTopics.slice(topicIndex + 1),
          ];
        } else {
          updatedTopics = [...currentTopics, validIndicatorsPosition];
        }
        return updatedTopics;
      });
    },
    [setTopics],
  );

  const onDeleteIndicator = useCallback(
    (topicId: string | number, indicatorId: string | number) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const topicIndex = prev.findIndex((t) => t.id === topicId);
        if (topicIndex === -1) return prev;

        const updatedIndicators = prev[topicIndex].indicators.filter((i) => i.id !== indicatorId);

        const updatedTopics = [
          ...prev.slice(0, topicIndex),
          { ...prev[topicIndex], indicators: updatedIndicators },
          ...prev.slice(topicIndex + 1),
        ];

        return updatedTopics;
      });
      setEditionModeIndicator({});
    },
    [setTopics, setEditionModeIndicator],
  );

  return (
    <div className="flex flex-col space-y-20 print:space-y-6">
      {/* OVERVIEW */}
      <WidgetsOverview />

      {/* topicsData DASHBOARD */}

      {/* TO - DO - change topic dashboard (pass this to that component)*/}
      <div className="space-y-20">
        {topicsDashboard?.map((topic) => {
          const selectedTopic = topicsData?.find((t) => t.id === topic.id);
          if (isLoadingTopicsData) return null;
          return (
            <div key={topic.id} className="container relative print:break-before-page">
              <h2 className="mb-4 text-xl font-semibold">{selectedTopic?.label}</h2>

              <ResponsiveReactGridLayout
                className="layout animated"
                cols={{ lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 }}
                rowHeight={122}
                containerPadding={[0, 0]}
                isDraggable={reportEditionMode}
                isResizable={reportEditionMode}
                resizeHandles={["sw", "nw", "se", "ne"]}
                resizeHandle={false}
                compactType="vertical"
                onDrop={handleDrop}
                onDragStop={handleDrop}
                onResizeStop={handleDrop}
              >
                {topic.indicators.map(({ type, id, w, h, x, y }) => {
                  const dataGridConfig = {
                    x: x ?? 0,
                    y: y ?? 0,
                    w: w ?? DEFAULT_VISUALIZATION_SIZES[type]?.w,
                    h: h ?? DEFAULT_VISUALIZATION_SIZES[type]?.h,
                    minW: MIN_VISUALIZATION_SIZES[type]?.w,
                    minH: MIN_VISUALIZATION_SIZES[type]?.h,
                  };

                  return (
                    <div
                      key={`{"topic":"${topic.id}","indicator":"${id}","type":"${type}"}`}
                      id={`${id}-${type}`}
                      className="flex h-full flex-col"
                      data-grid={dataGridConfig}
                      onMouseEnter={() => {
                        if (reportEditionMode) {
                          setEditionModeIndicator({ [`${id}-${type}`]: true });
                        }
                      }}
                      onMouseLeave={() => {
                        if (reportEditionMode) {
                          setEditionModeIndicator({ [`${id}-${type}`]: false });
                        }
                      }}
                    >
                      {editionModeIndicator[`${id}-${type}`] && <MoveHandler />}
                      {editionModeIndicator[`${id}-${type}`] && (
                        <DeleteHandler
                          topicId={topic.id}
                          indicatorId={`${id}`}
                          onClick={onDeleteIndicator}
                        />
                      )}

                      {type === "map" && <WidgetMap ids={["fires"]} />}
                      {type === "chart" && <WidgetFundingByType />}
                      {type === "numeric" && <WidgetIndigenousLands />}
                      {type === "table" && <WidgetProtectedAreas />}

                      {editionModeIndicator[`${id}-${type}`] && <ResizeHandler />}
                    </div>
                  );
                })}
              </ResponsiveReactGridLayout>
            </div>
          );
        })}
      </div>

      {/* OTHER RESOURCES */}
      <WidgetsOtherResources />
    </div>
  );
}
