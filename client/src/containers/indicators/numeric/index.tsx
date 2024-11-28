import { useMemo } from "react";

import { useQueryFeatureId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/app/api/indicators/route";

import {
  Card,
  CardContent,
  // CardControls,
  // CardInfo,
  CardLoader,
  CardTitle,
  CardWidgetNumber,
} from "@/containers/card";

export interface NumericIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}
// extender indicator and limit to resource

export const NumericIndicators = ({ name, resource }: NumericIndicatorsProps) => {
  const query = useQueryFeatureId({ resource, type: "numeric" });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

  return (
    <Card>
      <CardTitle>{name}</CardTitle>

      <CardContent>
        <CardLoader query={[query]} className="h-12">
          <CardWidgetNumber value={VALUE} />
        </CardLoader>
      </CardContent>
    </Card>
  );
};
