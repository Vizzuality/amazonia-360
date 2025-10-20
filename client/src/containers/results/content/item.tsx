import { useCallback, useMemo } from "react";

import { Layout } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";

import { useAtom, useSetAtom } from "jotai";
import { useLocale } from "next-intl";
import { LuSparkles } from "react-icons/lu";

import { useGetTopicsId } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { TopicView } from "@/app/parsers";
import {
  reportEditionModeAtom,
  resultsSidebarTabAtom,
  useSyncAiSummary,
  useSyncTopics,
} from "@/app/store";

import { MIN_VISUALIZATION_SIZES } from "@/constants/topics";

import { useHighlightNewIndicator } from "@/containers/results/content/hooks";
import { ReportResultsContentIndicatorItem } from "@/containers/results/content/indicators/item";
import { ReportResultsSummary } from "@/containers/results/content/summary";

import { Button } from "@/components/ui/button";
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
  const locale = useLocale();
  const [, setTopics] = useSyncTopics();
  const [ai_summary] = useSyncAiSummary();
  const [reportEditionMode] = useAtom(reportEditionModeAtom);
  const setResultsSidebarTab = useSetAtom(resultsSidebarTabAtom);

  const { setOpen } = useSidebar();

  const EDITABLE = editable && reportEditionMode;
  const TOPIC = useGetTopicsId({ id: topic.id, locale });

  const handleDrop = useCallback(
    (layout: Layout[]) => {
      setTopics((prev) => {
        if (!prev) return prev;

        return prev.map((t) => {
          if (t.id === topic.id) {
            return {
              id: topic.id,
              indicators: layout.map((l) => {
                const { indicator, type } = JSON.parse(l.i);
                return {
                  id: indicator,
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
      const gridKey = JSON.stringify({ indicator: id, type });

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
              "pointer-events-none absolute -left-0.5 -top-0.5 z-0 h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-2xl bg-primary",
              "scale-95 opacity-0 transition-all duration-1000",
              "data-[status=active]:scale-100 data-[status=inactive]:scale-95 data-[status=active]:opacity-100 data-[status=inactive]:opacity-0",
              // "scale-100 opacity-100 transition-all duration-1000",
            )}
          />
          <ReportResultsContentIndicatorItem
            topic={topic}
            indicatorView={{
              id,
              type,
              basemapId: type === "map" ? indicator.basemapId : undefined,
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
        "container relative space-y-4 print:break-before-auto print:px-0": true,
      })}
    >
      {TOPIC?.id !== 0 && (
        <>
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-primary">{TOPIC?.name}</h2>

            <Button
              variant="outline"
              className="hidden gap-2 lg:inline-flex"
              onClick={() => {
                setResultsSidebarTab("ai_summaries");
                setOpen(true);
              }}
            >
              <LuSparkles />
              <span>AI assistant</span>
            </Button>
          </header>

          {ai_summary.enabled && <ReportResultsSummary topic={TOPIC} />}
        </>
      )}

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
