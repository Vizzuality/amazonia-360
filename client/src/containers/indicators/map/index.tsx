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

  if (!LAYER) return null;

  return (
    <WidgetMap
      indicator={props}
      basemapId={basemapId}
      layers={[LAYER]}
      isWebshot={props.isWebshot}
      isPdf={props.isPdf}
    />
  );
};
