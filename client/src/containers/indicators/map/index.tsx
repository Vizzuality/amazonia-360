import { useCallback, useMemo } from "react";

import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";

import { useGetIndicatorsLayerId } from "@/lib/indicators";

import {
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/types/indicator";
import { Indicator } from "@/types/indicator";

import { pdfIndicatorsMapStateAtom, useFormLocation } from "@/app/(frontend)/store";

import { BasemapIds } from "@/constants/basemaps";

import { useLoad } from "@/containers/indicators/load-provider";
import { IndicatorProvider } from "@/containers/indicators/provider";
import WidgetMap from "@/containers/widgets/map";

export const MapIndicators = (
  props: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceWebTile | ResourceImageryTile | ResourceImagery;
    basemapId?: BasemapIds;
    isWebshot?: boolean;
    isPdf?: boolean;
  },
) => {
  const { id, basemapId, isPdf } = props;

  const locale = useLocale();

  const { location } = useFormLocation();

  const LAYER = useGetIndicatorsLayerId(id, locale, {});

  const { onLoading, onReady } = useLoad();

  const pdfIndicatorsMapState = useAtomValue(pdfIndicatorsMapStateAtom);

  const enabled = useMemo(() => {
    if (!isPdf) return true;

    const i = pdfIndicatorsMapState.find((i) => i.id === `${id}-map`);

    if (i?.status === "ready") return true;

    // limit enabled only for the 6 first indicators that are loading
    const activeLoadingIndicators = pdfIndicatorsMapState
      .filter((i) => i.status === "loading")
      .slice(0, 6);

    const i1 = activeLoadingIndicators.find((il) => il.id === `${id}-map`);

    if (i1) return true;

    return false;
  }, [id, isPdf, pdfIndicatorsMapState]);

  const handleLoading = useCallback(() => {
    onLoading(`${id}-map`);
  }, [id, onLoading]);

  const handleLoad = useCallback(() => {
    onReady(`${id}-map`);
  }, [id, onReady]);

  if (!LAYER || !location) return null;

  return (
    <IndicatorProvider onLoading={handleLoading} onLoad={handleLoad}>
      <WidgetMap
        key={JSON.stringify(location)}
        indicator={props}
        location={location}
        basemapId={basemapId}
        layers={[LAYER]}
        isWebshot={props.isWebshot}
        isPdf={props.isPdf}
        enabled={enabled}
      />
    </IndicatorProvider>
  );
};
