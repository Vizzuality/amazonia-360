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
  const { id, type } = indicatorView;

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

  const indicatorBasemap = (indicatorView as IndicatorMapView)?.basemapId;
  const INDICATOR = useMemo(() => {
    return (
      <IndicatorCard
        key={`${topic.id}-${id}`}
        id={id}
        type={type}
        editable={editable}
        basemapId={type === "map" ? indicatorView.basemapId : undefined}
      />
    );
  }, [topic.id, id, type, editable, indicatorBasemap]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      id={`${id}-${type}`}
      className="relative z-10 flex h-full flex-col"
      onMouseEnter={() => {
        if (editing) {
          setEditionModeIndicator({ [`${id}-${type}`]: true });
        }
      }}
      onMouseLeave={() => {
        if (editing) {
          setEditionModeIndicator({ [`${id}-${type}`]: false });
        }
      }}
    >
      {editionModeIndicator[`${id}-${type}`] && editing && <MoveHandler />}
      {editionModeIndicator[`${id}-${type}`] && editing && (
        <DeleteHandler indicatorId={id} type={type} onClick={handleDelete} />
      )}

      {INDICATOR}

      {editionModeIndicator[`${id}-${type}`] && editing && <ResizeHandler />}
    </div>
  );
};
