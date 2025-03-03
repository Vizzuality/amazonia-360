import { useMemo } from "react";

import Color from "@arcgis/core/Color";

import { useResourceFeatureLayerId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/app/local-api/indicators/route";

import Legend from "@/components/map/legend";
import LegendItem, { LegendItemProps } from "@/components/map/legend/item";

export interface WidgetLegendProps {
  indicator: Indicator;
}

export const WidgetLegend = ({
  name_en,
  resource,
}: Omit<Indicator, "resource"> & {
  resource: ResourceFeature;
}) => {
  const { data: layerData, isFetched, isFetching } = useResourceFeatureLayerId({ resource });

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
            label: name_en,
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
  }, [name_en, layerData]);

  if (!LEGEND || !isFetched || isFetching) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 duration-700 animate-in fade-in-0">
      <Legend defaultOpen={true}>
        <LegendItem {...LEGEND} direction="vertical" />
      </Legend>
    </div>
  );

  return "Legend";
};
