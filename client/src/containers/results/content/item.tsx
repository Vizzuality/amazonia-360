import { useCallback } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom } from "jotai";

import { useGetTopicsId } from "@/lib/topics";

import { VisualizationType } from "@/app/local-api/indicators/route";
import { TopicView } from "@/app/parsers";
import { indicatorsEditionModeAtom, reportEditionModeAtom, useSyncTopics } from "@/app/store";

import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import DeleteHandler from "@/containers/results/content/controls/delete";
import MoveHandler from "@/containers/results/content/controls/drag";
import ResizeHandler from "@/containers/results/content/controls/resize";
// import { ReportResultsSummary } from "@/containers/report/results/content/summary";
import ReportResultsIndicator from "@/containers/results/content/indicator";

import { useSidebar } from "@/components/ui/sidebar";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export interface ReportResultsContentItemProps {
  topic: TopicView;
  editable: boolean;
}

export const ReportResultsContentItem = ({
  topic,
  editable = true,
}: ReportResultsContentItemProps) => {
  const [, setTopics] = useSyncTopics();
  const [editionModeIndicator, setEditionModeIndicator] = useAtom(indicatorsEditionModeAtom);
  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  const EDITABLE = editable && reportEditionMode;

  const TOPIC = useGetTopicsId(topic.id);

  const handleDrop = useCallback(
    (layout: Layout[]) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const i = prev?.findIndex((t) => t.id === topic.id);

        if (i === -1) return prev;

        prev[i] = {
          id: topic.id,
          indicators: layout.map((l) => {
            const { indicator, type } = JSON.parse(l.i);
            return {
              id: indicator,
              type: type,
              w: l.w,
              h: l.h,
              x: l.x,
              y: l.y,
            };
          }),
        };

        return prev;
      });
    },
    [topic.id, setTopics],
  );

  const onDeleteIndicator = useCallback(
    (indicatorId: number, type: VisualizationType) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const i = prev?.findIndex((t) => t.id === topic.id);

        if (i === -1) return prev;

        prev[i] = {
          id: topic.id,
          indicators: prev[i]?.indicators?.filter(
            (i) => !(i.id === indicatorId && i.type === type),
          ),
        };

        return prev;
      });

      setEditionModeIndicator({});
    },
    [topic.id, setTopics, setEditionModeIndicator],
  );

  const handleEdit = useCallback(() => {
    toggleSidebar();
    setReportEditionMode(!reportEditionMode);
  }, [toggleSidebar, setReportEditionMode, reportEditionMode]);

  return (
    <div key={topic.id} className="container relative print:break-before-page">
      <h2 className="mb-4 text-xl font-semibold">{TOPIC?.name_en}</h2>

      {/* <ReportResultsSummary topic={TOPIC} /> */}

      <ResponsiveReactGridLayout
        className="layout animated"
        cols={{ lg: 4, md: 4, sm: 4, xs: 4, xxs: 1 }}
        rowHeight={122}
        containerPadding={[0, 0]}
        isDraggable={EDITABLE}
        isResizable={EDITABLE}
        resizeHandles={["sw", "nw", "se", "ne"]}
        resizeHandle={false}
        compactType="vertical"
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
              key={`{"topic":${topic.id},"indicator":${id},"type":"${type}"}`}
              id={`${id}-${type}`}
              className="flex h-full flex-col"
              data-grid={dataGridConfig}
              onMouseEnter={() => {
                if (EDITABLE) {
                  setEditionModeIndicator({ [`${id}-${type}`]: true });
                }
              }}
              onMouseLeave={() => {
                if (EDITABLE) {
                  setEditionModeIndicator({ [`${id}-${type}`]: false });
                }
              }}
            >
              {editionModeIndicator[`${id}-${type}`] && EDITABLE && <MoveHandler />}
              {editionModeIndicator[`${id}-${type}`] && EDITABLE && (
                <DeleteHandler indicatorId={id} type={type} onClick={onDeleteIndicator} />
              )}

              <ReportResultsIndicator
                key={`${topic.id}-${id}`}
                id={id}
                type={type}
                editable={editable}
                onEdit={handleEdit}
              />

              {editionModeIndicator[`${id}-${type}`] && EDITABLE && <ResizeHandler />}
            </div>
          );
        })}
      </ResponsiveReactGridLayout>
    </div>
  );
};

export default ReportResultsContentItem;
