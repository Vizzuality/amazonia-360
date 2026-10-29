import { useMemo } from "react";

import { getImageryScalar, hasImageryCoverage } from "@/lib/imagery";
import { useQueryImageryId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceImagery } from "@/types/indicator";

import { CardWidgetNumber } from "@/containers/card";
import { CardState } from "@/containers/card/state";
import { useIndicator } from "@/containers/indicators/provider";

import { Report } from "@/payload-types";

export interface NumericImageryIndicatorsProps extends Indicator {
  location?: Report["location"];
  resource: ResourceImagery;
  isPdf?: boolean;
}

export const NumericImageryIndicators = ({
  id,
  unit,
  location,
  resource,
  description_short,
  isPdf,
}: NumericImageryIndicatorsProps) => {
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const query = useQueryImageryId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(
    () => getImageryScalar(query.data, resource.aggregation),
    [query.data, resource.aggregation],
  );

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
    <CardState
      query={[query]}
      isEmpty={VALUE === null || !hasImageryCoverage(query.data?.histograms)}
      variant="inline"
      className="h-12 grow"
    >
      {isPdf && !!description_short && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description_short}</p>
      )}
      <CardWidgetNumber value={VALUE ?? 0} unit={unit} className={cn({ "grow-0": isPdf })} />
    </CardState>
  );
};
