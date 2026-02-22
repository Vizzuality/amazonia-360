import { useCallback, useMemo } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom } from "jotai";
import { useLocale } from "next-intl";

import { useGetTopicsId } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { TopicView } from "@/app/(frontend)/parsers";
import { reportEditionModeAtom, useFormTopics } from "@/app/(frontend)/store";

import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import { useHighlightNewIndicator } from "@/containers/results/content/hooks";
import { ReportResultsContentIndicatorItem } from "@/containers/results/content/indicators/item";
import { ReportTopicHeader } from "@/containers/results/content/item/header";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export interface ReportResultsContentItemProps {
  topic: TopicView;
  editable: boolean;
}

export const ReportResultsContentItem = ({
  topic,
  editable = true,
}: ReportResultsContentItemProps) => {
  const locale = useLocale();

  const { setTopics } = useFormTopics();
  const [reportEditionMode] = useAtom(reportEditionModeAtom);

  const EDITABLE = editable && reportEditionMode;
  const TOPIC = useGetTopicsId({ id: topic.topic_id, locale });

  const handleDrop = useCallback(
    (layout: Layout[]) => {
      setTopics((prev) => {
        if (!prev) return prev;

        return prev.map((t) => {
          if (t.id === topic.id) {
            return {
              id: topic.id,
              topic_id: topic.topic_id,
              indicators: layout.map((l) => {
                const { indicator, type } = JSON.parse(l.i);
                return {
                  id: indicator,
                  indicator_id: indicator,
                  type,
                  w: l.w,
                  h: l.h,
                  x: l.x,
                  y: l.y,
                };
              }),
            };
          }
          return t;
        });
      });
    },
    [topic.id, topic.topic_id, setTopics],
  );

  const INDICATORS = useMemo(() => {
    return topic?.indicators?.map((indicator) => {
      const { type, indicator_id, w, h, x, y } = indicator;
      const dataGridConfig = {
        x: x ?? 0,
        y: y ?? 0,
        w: w,
        h: h,
        minW: MIN_VISUALIZATION_SIZES[type]?.w ?? 1,
        minH: MIN_VISUALIZATION_SIZES[type]?.h ?? 1,
      };
      const refKey = `widget-${topic.topic_id}-${indicator_id}-${type}`;
      const gridKey = JSON.stringify({ indicator: indicator_id, type });

      return (
        <div
          id={refKey}
          key={gridKey}
          className={cn("relative flex h-full flex-col")}
          data-grid={dataGridConfig}
        >
          <div
            id={`${refKey}-outline`}
            className={cn(
              "bg-primary pointer-events-none absolute -top-0.5 -left-0.5 z-0 h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-2xl",
              "scale-95 opacity-0 transition-all duration-1000",
              "data-[status=active]:scale-100 data-[status=active]:opacity-100 data-[status=inactive]:scale-95 data-[status=inactive]:opacity-0",
              // "scale-100 opacity-100 transition-all duration-1000",
            )}
          />
          <ReportResultsContentIndicatorItem
            topic={topic}
            indicatorView={{
              ...indicator,
              ...(type === "map" && { basemapId: indicator.basemapId }),
            }}
            editable={editable}
            editing={EDITABLE}
          />
        </div>
      );
    });
  }, [topic, editable, EDITABLE]);

  useHighlightNewIndicator(INDICATORS, !EDITABLE);

  return (
    <div
      key={topic.id}
      className={cn({
        "relative container space-y-4 print:break-before-auto print:px-0": true,
      })}
    >
      {!!TOPIC && TOPIC?.id !== 0 && <ReportTopicHeader {...TOPIC} />}

      <ResponsiveReactGridLayout
        className="layout animated print:break-after-page print:px-0"
        cols={{ lg: 4, md: 4, sm: 4, xs: 4, xxs: 1 }}
        rowHeight={122}
        containerPadding={[0, 0]}
        isDraggable={EDITABLE}
        isResizable={EDITABLE}
        resizeHandles={["sw", "se"]}
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
