import { useMemo, MouseEvent } from "react";

import { useQueryFeatureId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/app/api/indicators/route";

import {
  Card,
  CardContent,
  CardControls,
  CardHeader,
  CardInfo,
  CardLoader,
  CardSettings,
  CardTitle,
  CardWidgetNumber,
} from "@/containers/card";
import InfoArcGis from "@/containers/info/arcgis";

export interface NumericIndicatorsProps extends Indicator {
  resource: ResourceFeature;
  onEdit?: (e: MouseEvent<HTMLElement>) => void;
}
// extender indicator and limit to resource

export const NumericIndicators = ({ name, id, resource, onEdit }: NumericIndicatorsProps) => {
  const query = useQueryFeatureId({ resource, type: "numeric" });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

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
        <CardLoader query={[query]} className="h-12">
          <CardWidgetNumber value={VALUE} />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
