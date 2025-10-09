import { useCallback, useMemo } from "react";

import { useLocale } from "next-intl";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

import { useGetIndicatorsId } from "@/lib/indicators";

import {
  Indicator,
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
} from "@/types/indicator";

import { useSyncIndicators, useSyncIndicatorsSettings } from "@/app/store";

import InfoControl from "@/components/map/legend/controls/info";
import OpacityControl from "@/components/map/legend/controls/opacity";
import RemoveControl from "@/components/map/legend/controls/remove";
import { FeatureLegend } from "@/components/map/legend/types/feature";
import { ImageryLegend } from "@/components/map/legend/types/imagery";
import { Button } from "@/components/ui/button";

export const LegendItem = ({ id }: { id: Indicator["id"] }) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);
  const [, setIndicators] = useSyncIndicators();
  const [indicatorsSettings, setIndicatorsSettings] = useSyncIndicatorsSettings();

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

  const handleChangeOrder = useCallback(
    (id: Indicator["id"], direction: -1 | 1) => {
      setIndicators((prev) => {
        if (!prev) return prev;

        const index = prev.findIndex((i) => i === id);
        if (index === -1) return prev;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= prev.length) return prev;

        const newIndicators = [...prev];
        const temp = newIndicators[newIndex];
        // Swap positions
        newIndicators[newIndex] = newIndicators[index];
        newIndicators[index] = temp;

        return newIndicators;
      });
    },
    [setIndicators],
  );

  if (!indicator || !LEGEND) return null;

  const { name } = indicator;

  return (
    <div className="space-y-1 p-4">
      <header className="flex justify-between gap-2 pl-1">
        <div className="relative flex pl-2">
          <div className="absolute right-full top-0 -mr-1.5">
            <Button
              variant="ghost"
              type="button"
              aria-label="Move layer up"
              className="flex h-6 w-6 items-center justify-center p-0"
              onClick={() => handleChangeOrder(id, 1)}
            >
              <LuChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              type="button"
              aria-label="Move layer down"
              className="flex h-6 w-6 items-center justify-center p-0"
              onClick={() => handleChangeOrder(id, -1)}
            >
              <LuChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <h3 className="mt-1 text-xs font-semibold text-foreground">{name}</h3>
        </div>

        <ul className="flex items-center gap-1">
          <li>
            <InfoControl {...indicator} />
          </li>

          <li>
            <OpacityControl
              value={indicatorsSettings[id]?.opacity ?? 1}
              onValueChange={(value) => {
                setIndicatorsSettings((prev) => ({
                  ...prev,
                  [id]: { ...prev[id], opacity: value[0] },
                }));
              }}
            />
          </li>
          <li>
            <RemoveControl
              onClick={() => {
                setIndicators((prev) => {
                  if (!prev) return prev;

                  if (prev.length === 1) return null;

                  return prev.filter((i) => i !== id);
                });
              }}
            />
          </li>
        </ul>
      </header>

      <div className="pl-3">{LEGEND}</div>
    </div>
  );
};
