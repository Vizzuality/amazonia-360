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
    <div className="absolute bottom-4 left-4 z-10 w-full max-w-60 animate-in shadow-xs duration-700 fade-in-0">
      <Legend defaultOpen interactive={indicator.interactive}>
        <div className="divide-y divide-muted">
          <LegendItem indicator={indicator} interactive={indicator.interactive} />
        </div>
      </Legend>
    </div>
  );
};
