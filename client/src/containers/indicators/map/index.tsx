import { useMemo } from "react";

import { useResourceId } from "@/lib/indicators";

import {
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/app/local-api/indicators/route";
import { Indicator } from "@/app/local-api/indicators/route";

import { CardLoader } from "@/containers/card";
import WidgetMap from "@/containers/widgets/map";

export const MapIndicators = (
  indicator: Omit<Indicator, "resource"> & {
    resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
  },
) => {
  const { id, resource } = indicator;
  const query = useResourceId({ resource });

  const LAYER: Partial<__esri.Layer> = useMemo(() => {
    if (resource.type === "web-tile") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "web-tile",
      };
    }

    if (resource.type === "imagery-tile") {
      return {
        id: `${id}`,
        url: resource.url,
        type: "imagery-tile",
      };
    }

    return {
      id: `${id}`,
      url: resource.url + resource.layer_id,
      type: resource.type,
    };
  }, [id, resource]);

  return (
    <CardLoader query={[query]} className="min-h-72 grow">
      <WidgetMap indicator={indicator} layers={[LAYER]} />
    </CardLoader>
  );
};
