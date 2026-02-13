"use client";

import {
  Indicator,
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
} from "@/types/indicator";

import { LegendItem } from "@/containers/widgets/map/legend/item";

import Legend from "@/components/map/legend";

export interface WidgetLegendProps {
  indicator: Indicator;
}

export const WidgetLegend = (
  indicator: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceImagery | ResourceImageryTile;
    interactive?: boolean;
  },
) => {
  return (
    <div className="animate-in fade-in-0 absolute bottom-4 left-4 z-10 w-full max-w-60 shadow-xs duration-700">
      <Legend defaultOpen interactive={indicator.interactive}>
        <div className="divide-muted divide-y">
          <LegendItem id={indicator.id} interactive={indicator.interactive} />
        </div>
      </Legend>
    </div>
  );
};
