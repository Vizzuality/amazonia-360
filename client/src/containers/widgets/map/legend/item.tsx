import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";

import {
  Indicator,
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
} from "@/types/indicator";

import OpacityControl from "@/containers/widgets/map/legend/opacity-control";

import InfoControl from "@/components/map/legend/controls/info";
import { FeatureLegend } from "@/components/map/legend/types/feature";
import { ImageryLegend } from "@/components/map/legend/types/imagery";

export const LegendItem = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);

  const LEGEND = useMemo(() => {
    if (!indicator) return null;
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

  if (!indicator || !LEGEND) return null;

  const { name } = indicator;

  return (
    <div className="space-y-1 p-4">
      <header className="flex justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground">{name}</h3>

        <ul className="flex -translate-y-1 items-center gap-1">
          <li>
            <InfoControl {...indicator} />
          </li>

          <li>
            <OpacityControl indicator={indicator} />
          </li>
        </ul>
      </header>

      {LEGEND}
    </div>
  );
};
