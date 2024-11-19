"use client";

import { useCallback, MouseEvent } from "react";

import { Layout } from "react-grid-layout";

import { useAtom } from "jotai";

import { cn } from "@/lib/utils";

import { Topics, TopicsParsed } from "@/app/parsers";
import { indicatorsEditionModeAtom, reportEditionModeAtom, useSyncTopics } from "@/app/store";

import { DatasetIds } from "@/constants/datasets";
import { DEFAULT_VISUALIZATION_SIZES, MIN_VISUALIZATION_SIZES, TOPICS } from "@/constants/topics";

import DeleteHandler from "@/containers/report/indicators/controls/delete";
import MoveHandler from "@/containers/report/indicators/controls/drag";
import ResizeHandler from "@/containers/report/indicators/controls/resize";
import GridLayout from "@/containers/report/indicators/dashboard";
import WidgetFundingByType from "@/containers/widgets/financial/funding-by-type";
// import WidgetTotalOperations from "@/containers/widgets/financial/total-operations";
import WidgetMap from "@/containers/widgets/map";
import NumericWidget from "@/containers/widgets/numeric";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";

import { useSidebar } from "@/components/ui/sidebar";

import { VisualizationType } from "../../visualization-types/types";

interface IndicatorData {
  type: VisualizationType;
  id: string | number;
  x: number;
  y: number;
  w: number;
  h: number;
}

let currentX = 0;
let currentY = 0;
const MAX_COLUMNS = 8;

export default function ReportResultsContent() {
  const [topics, setTopics] = useSyncTopics();
  const [editionModeIndicator, setEditionModeIndicator] = useAtom(indicatorsEditionModeAtom);
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);
  const { toggleSidebar } = useSidebar();

  const topicsDashboard = topics?.sort((a, b) => {
    if (!topics) return 0;
    const indexA = topics.findIndex((t) => t.id === a.id);
    const indexB = topics.findIndex((t) => t.id === b.id);
    return indexA - indexB;
  });

  const onEditionMode = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const id = e.currentTarget.id;
      toggleSidebar();
      setReportEditionMode(!reportEditionMode);
      setEditionModeIndicator({ [id]: !editionModeIndicator[id] });
    },
    [
      editionModeIndicator,
      setEditionModeIndicator,
      reportEditionMode,
      setReportEditionMode,
      toggleSidebar,
    ],
  );

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

      {/* TOPICS DASHBOARD */}

      {/* TO - DO - change topic dashboard (pass this to that component)*/}
      <div className="space-y-5">
        {topicsDashboard?.map((topic) => {
          const selectedTopic = TOPICS.find((t) => t.id === topic.id);
          return (
            <div key={topic.id} className="container relative print:break-before-page">
              <h2 className="mb-4 text-xl font-semibold">{selectedTopic?.label}</h2>
              <GridLayout
                className="layout"
                containerPadding={[0, 0]}
                isDraggable={reportEditionMode}
                isResizable={reportEditionMode}
                style={{ pointerEvents: "all" }}
                onDragStop={handleDrop}
                rowHeight={122}
              >
                {topic.indicators.map(({ type, id }, index) => {
                  const widgetWidth = DEFAULT_VISUALIZATION_SIZES[type].w;
                  const widgetHeight = DEFAULT_VISUALIZATION_SIZES[type].h;

                  // Move to the next row if the widget doesn't fit in the current row
                  if (currentX + widgetWidth > MAX_COLUMNS) {
                    currentY += topic?.indicators?.[index - 1]?.h || 0;
                    currentX = 0;
                  }

                  const dataGridConfig = {
                    x: topic?.indicators?.[index - 1]?.w ? 0 : currentX,
                    y: currentY,
                    w: widgetWidth,
                    h: widgetHeight,
                    minW: MIN_VISUALIZATION_SIZES[type].w,
                    minH: MIN_VISUALIZATION_SIZES[type].h,
                  };

                  return (
                    <div
                      key={`{"topic":"${topic.id}","indicator":"${id}","type":"${type}"}`}
                      id={id as string}
                      data-grid={dataGridConfig}
                      className={cn({
                        "pointer-events-none opacity-50 transition-opacity duration-300":
                          Object.keys(editionModeIndicator)[0] !== id &&
                          Object.values(editionModeIndicator)[0],
                      })}
                      onMouseEnter={() => {
                        if (reportEditionMode) {
                          setEditionModeIndicator({ [id]: true });
                        }
                      }}
                      onMouseLeave={() => {
                        if (reportEditionMode) {
                          setEditionModeIndicator({ [id]: false });
                        }
                      }}
                    >
                      {editionModeIndicator[id] && <MoveHandler />}
                      {editionModeIndicator[id] && (
                        <DeleteHandler
                          topicId={topic.id}
                          indicatorId={id}
                          onClick={onDeleteIndicator}
                        />
                      )}
                      {type === "map" && (
                        <WidgetMap id={id} ids={["fires"]} onEditionMode={onEditionMode} />
                      )}
                      {type === "chart" && (
                        <WidgetFundingByType id={id} onEditionMode={onEditionMode} />
                      )}
                      {type === "numeric" && (
                        <NumericWidget id={id as DatasetIds} onEditionMode={onEditionMode} />
                      )}
                      {type === "table" && (
                        <WidgetProtectedAreas id={id} onEditionMode={onEditionMode} />
                      )}
                      {editionModeIndicator[id] && <ResizeHandler />}
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
