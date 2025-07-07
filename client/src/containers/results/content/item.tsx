import { useCallback, useMemo } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom } from "jotai";
import { useLocale } from "next-intl";

import { useGetTopicsId } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { TopicView } from "@/app/parsers";
import { reportEditionModeAtom, useSyncAiSummary, useSyncTopics } from "@/app/store";

import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import { useHighlightNewIndicator } from "@/containers/results/content/hooks";
import { ReportResultsContentIndicatorItem } from "@/containers/results/content/indicators/item";
import { ReportResultsSummary } from "@/containers/results/content/summary";

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
  const [, setTopics] = useSyncTopics();
  const [ai_summary] = useSyncAiSummary();
  const [reportEditionMode] = useAtom(reportEditionModeAtom);

  const EDITABLE = editable && reportEditionMode;
  const TOPIC = useGetTopicsId(topic.id, locale);
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
    return topic?.indicators?.map((indicator) => {
      const { type, id, w, h, x, y } = indicator;
      const dataGridConfig = {
        x: x ?? 0,
        y: y ?? 0,
        w: w,
        h: h,
        minW: MIN_VISUALIZATION_SIZES[type]?.w ?? 1,
        minH: MIN_VISUALIZATION_SIZES[type]?.h ?? 1,
      };
      const refKey = `widget-${topic.id}-${id}-${type}`;
      return (
        <div
          key={refKey}
          id={refKey}
          className={cn("flex h-full flex-col")}
          data-grid={dataGridConfig}
        >
          <ReportResultsContentIndicatorItem
            topic={topic}
            indicatorView={{
              id,
              type,
              basemapId: type === "map" ? indicator.basemapId : undefined,
            }}
            editable={editable}
          />
        </div>
      );
    });
  }, [topic, editable, EDITABLE]); // eslint-disable-line react-hooks/exhaustive-deps

  useHighlightNewIndicator(INDICATORS, !EDITABLE);

  return (
    <div
      key={topic.id}
      className={cn({
        "container relative space-y-4 print:break-before-auto print:px-0": true,
      })}
    >
      <h2 className="text-xl font-semibold">{TOPIC?.name}</h2>

      {TOPIC?.id !== 0 && ai_summary.enabled && <ReportResultsSummary topic={TOPIC} />}

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
