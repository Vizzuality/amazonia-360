import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId, useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { useSyncLocation } from "@/app/store";

import { CardLoader, CardWidgetNumber } from "@/containers/card";

export interface NumericIndicatorsProps extends Indicator {
  resource: ResourceFeature;
  isPdf?: boolean;
}

export const NumericIndicators = ({
  id,
  resource,
  description_short,
  isPdf,
}: NumericIndicatorsProps) => {
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
      <CardWidgetNumber value={VALUE} unit={indicator?.unit} className={cn({ "grow-0": isPdf })} />
      {isPdf && !!description_short && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description_short}</p>
      )}
    </CardLoader>
  );
};
