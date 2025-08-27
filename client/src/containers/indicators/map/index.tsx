import { useMemo } from "react";

import { useResourceId } from "@/lib/indicators";

import {
  ResourceFeature,
  ResourceImagery,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/types/indicator";
import { Indicator } from "@/types/indicator";

import { CardLoader } from "@/containers/card";
import WidgetMap from "@/containers/widgets/map";

import { BASEMAPS } from "@/components/map/controls/basemap";

export const MapIndicators = (
  indicator: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceWebTile | ResourceImageryTile | ResourceImagery;
    basemapId?: (typeof BASEMAPS)[number]["id"];
  },
) => {
  const { id, resource, basemapId } = indicator;
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
      <WidgetMap indicator={indicator} basemapId={basemapId} layers={[LAYER]} />
    </CardLoader>
  );
};
