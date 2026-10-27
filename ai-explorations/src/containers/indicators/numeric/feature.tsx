import { useMemo } from "react";

import { useQueryFeatureId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { CardLoader, CardWidgetNumber } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";

import { Report } from "@/payload-types";

export interface NumericIndicatorsProps extends Indicator {
  location?: Report["location"];
  resource: ResourceFeature;
  isPdf?: boolean;
}

export const NumericIndicatorsFeature = ({
  id,
  unit,
  location,
  resource,
  description_short,
  isPdf,
}: NumericIndicatorsProps) => {
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const query = useQueryFeatureId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => {
    if (!query.data) return 0;

    return query.data.features.reduce((acc, curr) => {
      return acc + curr.attributes.value;
    }, 0);
  }, [query.data]);

  useMemo(() => {
    if (query.isLoading) {
      onIndicatorViewLoading(id);
    }

    if (query.isError) {
      onIndicatorViewError(id);
    }

    if (query.isSuccess) {
      onIndicatorViewLoaded(id);
    }
  }, [query, id, onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError]);

  return (
    <CardLoader query={[query]} className="h-12">
      {isPdf && !!description_short && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description_short}</p>
      )}
      <CardWidgetNumber value={VALUE} unit={unit} className={cn({ "grow-0": isPdf })} />
    </CardLoader>
  );
};
