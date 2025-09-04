"use client";

import { useMemo } from "react";

import Color from "@arcgis/core/Color";

import { useResourceFeatureLayerId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { CardLoader } from "@/containers/card";

import Legend from "@/components/map/legend";
import LegendItem, { LegendItemProps } from "@/components/map/legend/item";

import OpacityControlButton from "./opacity-control";

export interface FeatureLegendProps {
  indicator: Indicator;
}
export const FeatureLegend = ({
  name,
  resource,
  ...indicator
}: Omit<Indicator, "resource"> & {
  resource: ResourceFeature;
}) => {
  const query = useResourceFeatureLayerId({ resource });
  const { data: layerData } = query;

  const LEGEND = useMemo<LegendItemProps | null>(() => {
    if (!layerData) return null;

    const renderer = layerData?.drawingInfo?.renderer;

    if (renderer?.type === "simple") {
      const r = renderer as __esri.SimpleRenderer;

      if (!r.symbol) return null;

      if (!("color" in r.symbol)) return null;

      return {
        type: "basic",
        items: [
          {
            id: "1",
            color: new Color(r.symbol.color).toHex(),
            label: name,
          },
        ],
      };
    }

    if (renderer?.type === "uniqueValue") {
      const r = renderer as __esri.UniqueValueRenderer;

      return {
        type: "basic",
        items: r.uniqueValueInfos?.map((u) => ({
          id: u.value,
          color: new Color(u.symbol.color).toHex(),
          label: `${u.label}`,
        })),
      };
    }

    if (renderer?.type === "classBreaks") {
      const r = renderer as __esri.ClassBreaksRenderer;

      return {
        type: "basic",
        items: r.classBreakInfos?.map((c) => ({
          id: c.label,
          color: new Color(c.symbol.color).toHex(),
          label: `${c.label}`,
        })),
      };
    }

    return null;
  }, [name, layerData]);

  return (
    <Legend defaultOpen actionButtons={<OpacityControlButton indicator={indicator} />}>
      <CardLoader query={[query]} className="h-10 grow">
        {!!LEGEND && <LegendItem {...LEGEND} direction="vertical" />}
      </CardLoader>
    </Legend>
  );
};
