import { useMemo } from "react";

import { useLocale } from "next-intl";

import { imageryScalar } from "@/lib/imagery";
import { useGetIndicatorsId, useQueryImageryId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceImagery } from "@/types/indicator";

import { CardLoader, CardWidgetNumber } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";

import { Report } from "@/payload-types";

export interface NumericImageryIndicatorsProps extends Indicator {
  location?: Report["location"];
  resource: ResourceImagery;
  isPdf?: boolean;
}

export const NumericImageryIndicators = ({
  id,
  location,
  resource,
  description_short,
  isPdf,
}: NumericImageryIndicatorsProps) => {
  const locale = useLocale();
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const indicator = useGetIndicatorsId(id, locale);

  const query = useQueryImageryId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(
    () => imageryScalar(query.data, resource.aggregation),
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
    <CardLoader query={[query]} className="h-12 grow">
      {isPdf && !!description_short && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description_short}</p>
      )}
      <CardWidgetNumber
        value={VALUE ?? "n.d."}
        unit={!!VALUE ? indicator?.unit : undefined}
        className={cn({ "grow-0": isPdf })}
      />
    </CardLoader>
  );
};
