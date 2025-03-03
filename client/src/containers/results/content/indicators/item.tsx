"use client";
import { useCallback, useMemo } from "react";

import { useAtom } from "jotai";

import { VisualizationTypes } from "@/app/local-api/indicators/route";
import { IndicatorView, TopicView } from "@/app/parsers";
import { indicatorsEditionModeAtom, reportEditionModeAtom, useSyncTopics } from "@/app/store";

import IndicatorCard from "@/containers/results/content/indicators/card";
import DeleteHandler from "@/containers/results/content/indicators/controls/delete";
import MoveHandler from "@/containers/results/content/indicators/controls/drag";
import ResizeHandler from "@/containers/results/content/indicators/controls/resize";

import { useSidebar } from "@/components/ui/sidebar";

export interface ReportResultsContentIndicatorItemProps {
  topic: TopicView;
  indicator: IndicatorView;
  editable: boolean;
}

export const ReportResultsContentIndicatorItem = ({
  topic,
  indicator,
  editable = true,
}: ReportResultsContentIndicatorItemProps) => {
  const [, setTopics] = useSyncTopics();
  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);
  const [editionModeIndicator, setEditionModeIndicator] = useAtom(indicatorsEditionModeAtom);

  const { id, type } = indicator;

  const EDITABLE = editable && reportEditionMode;

  const handleDelete = useCallback(
    (indicatorId: number, type: VisualizationTypes) => {
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

  const INDICATOR = useMemo(() => {
    return (
      <IndicatorCard
        key={`${topic.id}-${id}`}
        id={id}
        type={type}
        editable={editable}
        onEdit={handleEdit}
      />
    );
  }, [topic.id, id, type, editable, handleEdit]);

  return (
    <div
      id={`${id}-${type}`}
      className="flex h-full flex-col"
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
        <DeleteHandler indicatorId={id} type={type} onClick={handleDelete} />
      )}

      {INDICATOR}

      {editionModeIndicator[`${id}-${type}`] && EDITABLE && <ResizeHandler />}
    </div>
  );
};
