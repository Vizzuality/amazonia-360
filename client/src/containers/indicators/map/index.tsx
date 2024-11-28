import { useMemo, MouseEvent } from "react";

import { useResourceId } from "@/lib/indicators";
import { useSession } from "@/lib/session";

import { Indicator } from "@/app/api/indicators/route";

import {
  Card,
  CardContent,
  CardControls,
  CardInfo,
  CardHeader,
  CardLoader,
  CardTitle,
  CardSettings,
} from "@/containers/card";
import InfoArcGis from "@/containers/info/arcgis";
import WidgetMap from "@/containers/map";

export interface MapIndicatorsProps extends Indicator {
  onEdit?: (e: MouseEvent<HTMLElement>) => void;
}

export const MapIndicators = ({ id, name, resource, onEdit }: MapIndicatorsProps) => {
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
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardControls>
          <CardInfo>
            <InfoArcGis id={id} />
          </CardInfo>

          {onEdit && <CardSettings id={id} onClick={onEdit} />}
        </CardControls>
      </CardHeader>
      <CardContent>
        <CardLoader query={[query]} className="min-h-72 grow">
          <WidgetMap layers={[LAYER]} />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
