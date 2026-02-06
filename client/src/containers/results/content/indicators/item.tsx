"use client";
import { useCallback, useMemo, useState } from "react";

import { VisualizationTypes } from "@/types/indicator";

import { IndicatorView, IndicatorMapView, TopicView } from "@/app/(frontend)/parsers";
import { useFormTopics } from "@/app/(frontend)/store";

import IndicatorCard from "@/containers/results/content/indicators/card";
import DeleteHandler from "@/containers/results/content/indicators/controls/delete";
import MoveHandler from "@/containers/results/content/indicators/controls/drag";
import ResizeHandler from "@/containers/results/content/indicators/controls/resize";

export interface ReportResultsContentIndicatorItemProps {
  topic: TopicView;
  indicatorView: IndicatorView;
  editable: boolean;
  editing: boolean;
}

export const ReportResultsContentIndicatorItem = ({
  topic,
  indicatorView,
  editable = true,
  editing = false,
}: ReportResultsContentIndicatorItemProps) => {
  const { setTopics } = useFormTopics();
  const [editionModeIndicator, setEditionModeIndicator] = useState(false);
  const { indicator_id, type } = indicatorView;

  const handleDelete = useCallback(
    (indicatorId: number, type: VisualizationTypes) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const newTopics = [...prev];

        const i = prev?.findIndex((t) => t.topic_id === topic.topic_id);

        if (i === -1) return prev;

        newTopics[i] = {
          ...newTopics[i],
          indicators: newTopics[i]?.indicators?.filter((ind) => {
            return !(ind.indicator_id === indicatorId && ind.type === type);
          }),
        };

        return newTopics;
      });

      setEditionModeIndicator(false);
    },
    [topic.topic_id, setTopics, setEditionModeIndicator],
  );

  const indicatorBasemap = (indicatorView as IndicatorMapView)?.basemapId;
  const INDICATOR = useMemo(() => {
    return (
      <IndicatorCard
        key={`${topic.id}-${indicator_id}-${type}`}
        id={indicator_id}
        type={type}
        editable={editable}
        basemapId={type === "map" ? indicatorView.basemapId : undefined}
      />
    );
  }, [topic.id, indicator_id, type, editable, indicatorBasemap]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      id={`${indicator_id}-${type}`}
      className="relative z-10 flex h-full flex-col"
      onMouseEnter={() => {
        if (editing) {
          setEditionModeIndicator(true);
        }
      }}
      onMouseLeave={() => {
        if (editing) {
          setEditionModeIndicator(false);
        }
      }}
    >
      {editionModeIndicator && editing && <MoveHandler />}
      {editionModeIndicator && editing && (
        <DeleteHandler indicatorId={indicator_id} type={type} onClick={handleDelete} />
      )}

      {INDICATOR}

      {editionModeIndicator && editing && <ResizeHandler />}
    </div>
  );
};
