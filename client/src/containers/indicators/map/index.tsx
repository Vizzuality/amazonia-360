import { useMemo } from "react";

import { useResourceId } from "@/lib/indicators";

import {
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/app/local-api/indicators/route";
import { Indicator } from "@/app/local-api/indicators/route";

import { CardLoader } from "@/containers/card";
import WidgetMap from "@/containers/widgets/map";

export const MapIndicators = (
  indicator: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceWebTile | ResourceImageryTile | ResourceImagery;
  },
) => {
  const { id, resource } = indicator;
  const query = useResourceId({ resource });

  const LAYER = useMemo(() => {
    if (resource.type === "web-tile") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "web-tile",
      } as Partial<__esri.WebTileLayer>;
    }

    if (resource.type === "imagery-tile") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "imagery-tile",
        rasterFunction: resource.rasterFunction,
      } as Partial<__esri.ImageryTileLayer>;
    }

    if (resource.type === "imagery") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "imagery",
        rasterFunction: resource.rasterFunction,
      } as Partial<__esri.ImageryLayer>;
    }

    return {
      id: `${id}`,
      url: resource.url + resource.layer_id,
      type: "feature",
      popupTemplate: resource.popupTemplate,
    } as Partial<__esri.FeatureLayer>;
  }, [id, resource]);

  return (
    <CardLoader query={[query]} className="min-h-72 grow">
      <WidgetMap indicator={indicator} layers={[LAYER]} />
    </CardLoader>
  );
};
