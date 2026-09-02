import { useMemo } from "react";

import { useLocale } from "next-intl";

import { imageryScalar } from "@/lib/imagery";
import { useGetIndicatorsId, useQueryImageryTileId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceImageryTile } from "@/types/indicator";

import { CardLoader, CardWidgetNumber } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";

import { Report } from "@/payload-types";

export interface NumericImageryTileIndicatorsProps extends Indicator {
  location?: Report["location"];
  resource: ResourceImageryTile;
  isPdf?: boolean;
}

export const NumericImageryTileIndicators = ({
  id,
  location,
  resource,
  description_short,
  isPdf,
}: NumericImageryTileIndicatorsProps) => {
  const locale = useLocale();
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const indicator = useGetIndicatorsId(id, locale);

  const query = useQueryImageryTileId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => imageryScalar(query.data, "sum"), [query.data]);

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
