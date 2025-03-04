import { useCallback, useMemo } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom } from "jotai";

import { useGetTopicsId } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { TopicView } from "@/app/parsers";
import { reportEditionModeAtom, useSyncAiSummary, useSyncTopics } from "@/app/store";

import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import { ReportResultsContentIndicatorItem } from "@/containers/results/content/indicators/item";
import { ReportResultsSummary } from "@/containers/results/content/summary";

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
  const { open: isSidebarOpen } = useSidebar();
  const [, setTopics] = useSyncTopics();
  const [ai_summary] = useSyncAiSummary();
  const [reportEditionMode] = useAtom(reportEditionModeAtom);

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

  const INDICATORS = useMemo(() => {
    return topic?.indicators?.map(({ type, id, w, h, x, y }) => {
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
        >
          <ReportResultsContentIndicatorItem
            topic={topic}
            indicator={{ id, type }}
            editable={EDITABLE}
          />
        </div>
      );
    });
  }, [topic, EDITABLE]);

  return (
    <div
      key={topic.id}
      className={cn({
        "container relative space-y-4 print:break-before-page": true,
        "pr-6": isSidebarOpen,
      })}
    >
      <h2 className="text-xl font-semibold">{TOPIC?.name_en}</h2>

      {TOPIC?.id !== 0 && ai_summary && <ReportResultsSummary topic={TOPIC} />}

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
        {INDICATORS}
      </ResponsiveReactGridLayout>
    </div>
  );
};

export default ReportResultsContentItem;
