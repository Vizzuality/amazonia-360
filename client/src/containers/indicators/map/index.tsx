import { useMemo } from "react";

import { useResourceId } from "@/lib/indicators";
import { useSession } from "@/lib/session";

import { Indicator } from "@/app/api/indicators/route";

import { Card, CardContent, CardLoader, CardTitle } from "@/containers/card";
import WidgetMap from "@/containers/map";

export const MapIndicators = ({ id, name, resource }: Indicator) => {
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
      <CardTitle>{name}</CardTitle>
      <CardContent>
        <CardLoader query={[query]} className="min-h-72 grow">
          <WidgetMap layers={[LAYER]} />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
