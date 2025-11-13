"use client";
import { useCallback, useMemo } from "react";

import { useAtom } from "jotai";

import { VisualizationTypes } from "@/types/indicator";

import { IndicatorView, IndicatorMapView, TopicView } from "@/app/(frontend)/parsers";
import { indicatorsEditionModeAtom, useSyncTopics } from "@/app/(frontend)/store";

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
  const [, setTopics] = useSyncTopics();
  const [editionModeIndicator, setEditionModeIndicator] = useAtom(indicatorsEditionModeAtom);
  const { indicator_id, type } = indicatorView;

  const handleDelete = useCallback(
    (indicatorId: number, type: VisualizationTypes) => {
      setTopics((prev) => {
        if (!prev) return prev;

        const i = prev?.findIndex((t) => t.id === topic.id);

        if (i === -1) return prev;

        prev[i] = {
          id: topic.id,
          topic_id: topic.topic_id,
          indicators: prev[i]?.indicators?.filter(
            (i) => !(i.indicator_id === indicatorId && i.type === type),
          ),
        };

        return prev;
      });

      setEditionModeIndicator({});
    },
    [topic.id, topic.topic_id, setTopics, setEditionModeIndicator],
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
          setEditionModeIndicator({ [`${indicator_id}-${type}`]: true });
        }
      }}
      onMouseLeave={() => {
        if (editing) {
          setEditionModeIndicator({ [`${indicator_id}-${type}`]: false });
        }
      }}
    >
      {editionModeIndicator[`${indicator_id}-${type}`] && editing && <MoveHandler />}
      {editionModeIndicator[`${indicator_id}-${type}`] && editing && (
        <DeleteHandler indicatorId={indicator_id} type={type} onClick={handleDelete} />
      )}

      {INDICATOR}

      {editionModeIndicator[`${indicator_id}-${type}`] && editing && <ResizeHandler />}
    </div>
  );
};
