import { useMemo } from "react";

import {
  Indicator,
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
} from "@/types/indicator";

import { FeatureLegend } from "@/containers/widgets/map/legend/feature";
import { ImageryLegend } from "@/containers/widgets/map/legend/imagery";

export interface WidgetLegendProps {
  indicator: Indicator;
}

export const WidgetLegend = (
  indicator: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceImagery | ResourceImageryTile;
  },
) => {
  const LEGEND = useMemo(() => {
    switch (indicator.resource.type) {
      case "feature": {
        const i = indicator as Omit<Indicator, "resource"> & {
          resource: ResourceFeature;
        };
        return <FeatureLegend {...i} />;
      }

      case "imagery": {
        const i = indicator as Omit<Indicator, "resource"> & {
          resource: ResourceImagery;
        };
        return <ImageryLegend {...i} />;
      }

      case "imagery-tile": {
        const i = indicator as Omit<Indicator, "resource"> & {
          resource: ResourceImageryTile;
        };
        return <ImageryLegend {...i} />;
      }
    }
  }, [indicator]);

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-[calc(50%_-_theme(spacing[8]))] shadow-sm duration-700 animate-in fade-in-0">
      {LEGEND}
    </div>
  );
};
