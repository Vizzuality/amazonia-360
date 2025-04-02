import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId, useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceFeature } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader, CardWidgetNumber } from "@/containers/card";

export interface NumericIndicatorsProps extends Indicator {
  resource: ResourceFeature;
}

export const NumericIndicators = ({ id, resource }: NumericIndicatorsProps) => {
  const locale = useLocale();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
  const indicator = useGetIndicatorsId(id, locale);

  const query = useQueryFeatureId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

  return (
    <CardLoader query={[query]} className="h-12">
      <CardWidgetNumber value={VALUE} unit={indicator?.unit} />
    </CardLoader>
  );
};
