"use client";

import { useLocale } from "next-intl";

import { useGetIndicatorsLayerId } from "@/lib/indicators";

import { Indicator } from "@/types/indicator";

import { useSyncIndicatorsSettings } from "@/app/store";

import Layer from "@/components/map/layers";

export default function LayerManagerItem({ id, index }: { id: Indicator["id"]; index: number }) {
  const locale = useLocale();

  const [indicatorsSettings] = useSyncIndicatorsSettings();

  const settings = indicatorsSettings?.[id] ?? {};

  const LAYER = useGetIndicatorsLayerId(id, locale, settings);

  if (!LAYER) return null;

  return <Layer index={index} layer={LAYER} />;
}
