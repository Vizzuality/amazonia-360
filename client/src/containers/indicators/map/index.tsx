import { useCallback } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsLayerId } from "@/lib/indicators";

import {
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/types/indicator";
import { Indicator } from "@/types/indicator";

import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";
import WidgetMap from "@/containers/widgets/map";

import { BASEMAPS } from "@/components/map/controls/basemap";

export const MapIndicators = (
  props: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceWebTile | ResourceImageryTile | ResourceImagery;
    basemapId?: (typeof BASEMAPS)[number]["id"];
    isWebshot?: boolean;
    isPdf?: boolean;
  },
) => {
  const { id, basemapId } = props;

  const locale = useLocale();

  const LAYER = useGetIndicatorsLayerId(id, locale, {});

  const { onReady } = useLoad();

  const handleLoad = useCallback(() => {
    onReady(`${id}-map`);
  }, [id, onReady]);

  if (!LAYER) return null;

  return (
    <IndicatorProvider onLoad={handleLoad}>
      <WidgetMap
        indicator={props}
        basemapId={basemapId}
        layers={[LAYER]}
        isWebshot={props.isWebshot}
        isPdf={props.isPdf}
      />
    </IndicatorProvider>
  );
};
