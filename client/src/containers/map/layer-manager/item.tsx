"use client";

import { useEffect, useState } from "react";

import { useAtomValue, useSetAtom } from "jotai";
import { useLocale } from "next-intl";

import { useGetIndicatorsLayerId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { useSyncIndicatorsSettings } from "@/app/(frontend)/store";

import {
  exploreLayerAttemptsAtom,
  exploreLayerStatusesAtom,
  getExploreLayerStatus,
} from "@/containers/map/layer-status/store";
import { useEmptyInView } from "@/containers/map/layer-status/use-empty-in-view";

import Layer from "@/components/map/layers";
import { LayerViewStatus } from "@/components/map/layers/layer-view-status";

export default function LayerManagerItem({ id, index }: { id: Indicator["id"]; index: number }) {
  const locale = useLocale();

  const [indicatorsSettings] = useSyncIndicatorsSettings();

  const settings = indicatorsSettings?.[id] ?? {};

  const LAYER = useGetIndicatorsLayerId(id, locale, settings);

  const attempt = useAtomValue(exploreLayerAttemptsAtom)[id] ?? 0;
  const setStatuses = useSetAtom(exploreLayerStatusesAtom);
  const [layerStatus, setLayerStatus] = useState<LayerViewStatus>("loading");

  const isEmptyInView = useEmptyInView(
    LAYER?.id,
    LAYER?.type === "feature" && layerStatus === "success",
  );

  const status = getExploreLayerStatus(layerStatus, isEmptyInView);

  useEffect(() => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }, [id, status, setStatuses]);

  useEffect(() => {
    return () => {
      setStatuses(({ [id]: _, ...rest }) => rest);
    };
  }, [id, setStatuses]);

  if (!LAYER) return null;

  return (
    <Layer
      key={`${LAYER.id}-${attempt}`}
      index={index}
      layer={LAYER}
      onStatusChange={setLayerStatus}
    />
  );
}
