import { useMemo } from "react";

import { useResourceId } from "@/lib/indicators";
import { useSession } from "@/lib/session";

import {
  Indicator,
  ResourceFeature,
  ResourceImageryTile,
  ResourceWebTile,
} from "@/app/api/indicators/route";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";
import WidgetMap from "@/containers/map";

export interface MapIndicatorsProps {
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
}

export const MapIndicators = ({ id, resource }: Indicator) => {
  const { data: session } = useSession();
  const query = useResourceId({ resource, session });

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
    <Card>
      <CardTitle>{resource.name}</CardTitle>
      <CardContent>
        <CardLoader query={[query]} className="h-72">
          <div className="h-72">
            <WidgetMap layers={[LAYER]} />
          </div>
        </CardLoader>
      </CardContent>
    </Card>
  );
};
