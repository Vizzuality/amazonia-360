import { useMemo } from "react";

import { useQueryFeatureId } from "@/lib/indicators";

import { Indicator, ResourceFeature } from "@/app/api/indicators/route";

import { CardLoader, CardWidgetNumber } from "@/containers/card";

export interface NumericIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}

export const NumericIndicators = ({ resource }: NumericIndicatorsProps) => {
  const query = useQueryFeatureId({ resource, type: "numeric" });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

  return (
    <CardLoader query={[query]} className="h-12">
      <CardWidgetNumber value={VALUE} />
    </CardLoader>
  );
};
