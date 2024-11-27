"use client";

import { useCallback, useMemo } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom } from "jotai";

import { useGetTopics } from "@/lib/topics";

import { Topics } from "@/app/parsers";
import { IndicatorView } from "@/app/parsers";
import { indicatorsEditionModeAtom, reportEditionModeAtom, useSyncTopics } from "@/app/store";

import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import DeleteHandler from "@/containers/report/indicators/controls/delete";
import MoveHandler from "@/containers/report/indicators/controls/drag";
import ResizeHandler from "@/containers/report/indicators/controls/resize";
import WidgetsOtherResources from "@/containers/widgets/other-resources";
import WidgetsOverview from "@/containers/widgets/overview";

import ReportResultsIndicator from "../indicator";
import { VisualizationType } from "@/app/api/indicators/route";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export default function ReportResultsContent() {
  const [topics, setTopics] = useSyncTopics();
  const [editionModeIndicator, setEditionModeIndicator] = useAtom(indicatorsEditionModeAtom);
  const [reportEditionMode] = useAtom(reportEditionModeAtom);

  const { data: topicsData, isLoading: isLoadingTopicsData } = useGetTopics();

  const topicsDashboard = useMemo(() => {
    return topics?.sort((a, b) => {
      if (!topics) return 0;
      const indexA = topics.findIndex((t) => t.id === a.id);
      const indexB = topics.findIndex((t) => t.id === b.id);
      return indexA - indexB;
    });
  }, [topics]);

  const handleDrop = useCallback(
    (layout: Layout[]) => {
      if (!layout) return;

      // Initialize `acc` with an empty object as `TopicsParsed`
      const indicatorsPosition = layout.reduce((acc, l) => {
        const { topic, indicator, type } = JSON.parse(l.i);
        const indicatorData: IndicatorView | undefined = {
          type,
          id: indicator,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
        };

        if (!acc.id) {
          acc.id = topic as Topics["id"];
          acc.indicators = [];
        }

        acc.indicators?.push(indicatorData);

        return acc;
      }, {} as Partial<Topics>);

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
    (topicId: number, indicatorId: number, type: VisualizationType) => {
      setTopics((prev) => {
        if (!prev) return prev;

        // For some reason this comes duplicated
        const prevTopics = prev.filter((topic) => typeof topic.id !== "string");

        const topicIndex = prevTopics.findIndex((t) => t.id === topicId);
        if (topicIndex === -1) return prevTopics;

        const updatedIndicators = prevTopics[topicIndex]?.indicators?.filter(
          (i) => !(i.id === indicatorId && i.type === type),
        );

        const updatedTopics = [
          ...prevTopics.slice(0, topicIndex),
          { ...prevTopics[topicIndex], indicators: updatedIndicators },
          ...prevTopics.slice(topicIndex + 1),
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
              <h2 className="mb-4 text-xl font-semibold">{selectedTopic?.name}</h2>

              <ResponsiveReactGridLayout
                className="layout animated"
                cols={{ lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 }}
                rowHeight={122}
                containerPadding={[0, 0]}
                isDraggable={reportEditionMode}
                isResizable={reportEditionMode}
                resizeHandles={["sw", "nw", "se", "ne"]}
                resizeHandle={false}
                compactType={null}
                onDrop={handleDrop}
                onDragStop={handleDrop}
                onResizeStop={handleDrop}
              >
                {topic?.indicators?.map(({ type, id, w, h, x, y }) => {
                  const dataGridConfig = {
                    x: x ?? 0,
                    y: y ?? 0,
                    w: w,
                    h: h,
                    minW: MIN_VISUALIZATION_SIZES[type]?.w ?? 1,
                    minH: MIN_VISUALIZATION_SIZES[type]?.h ?? 1,
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
                          indicatorId={id}
                          type={type}
                          onClick={onDeleteIndicator}
                        />
                      )}

                      <ReportResultsIndicator key={`${topic.id}-${id}`} id={id} type={type} />

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
