import { useMemo } from "react";

import { useQueryFeatureId } from "@/lib/indicators";
import { useLocationAdminUnit, useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceFeature } from "@/types/indicator";

import { CardWidgetNumber } from "@/containers/card";
import { CardState } from "@/containers/card/state";
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
  const adminUnit = useLocationAdminUnit(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const query = useQueryFeatureId({ id, resource, type: "numeric", geometry: GEOMETRY, adminUnit });

  // A count over nothing still answers one row of 0, which is a finding; an average over nothing
  // answers null, which is not.
  const VALUES = useMemo<number[]>(
    () =>
      (query.data?.features ?? [])
        .map((feature) => feature.attributes.value)
        .filter((value): value is number => typeof value === "number"),
    [query.data],
  );

  const VALUE = useMemo(() => VALUES.reduce((acc, curr) => acc + curr, 0), [VALUES]);

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
    <CardState query={[query]} isEmpty={!VALUES.length} variant="inline" className="h-12">
      {isPdf && !!description_short && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description_short}</p>
      )}
      <CardWidgetNumber value={VALUE} unit={unit} className={cn({ "grow-0": isPdf })} />
    </CardState>
  );
};
