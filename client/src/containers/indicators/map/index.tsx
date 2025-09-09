import { useLocale } from "next-intl";

import { useGetIndicatorsLayerId } from "@/lib/indicators";

import {
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/types/indicator";
import { Indicator } from "@/types/indicator";

import WidgetMap from "@/containers/widgets/map";

import { BASEMAPS } from "@/components/map/controls/basemap";

export const MapIndicators = (
  indicator: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceWebTile | ResourceImageryTile | ResourceImagery;
    basemapId?: (typeof BASEMAPS)[number]["id"];
  },
) => {
  const { id, basemapId } = indicator;

  const locale = useLocale();

  const LAYER = useGetIndicatorsLayerId(id, locale, {});

  if (!LAYER) return null;

  return <WidgetMap indicator={indicator} basemapId={basemapId} layers={[LAYER]} />;
};
