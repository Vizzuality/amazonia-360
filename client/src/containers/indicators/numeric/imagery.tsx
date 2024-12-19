import { useMemo } from "react";

import { useQueryImageryTileId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceImageryTile } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader, CardWidgetNumber } from "@/containers/card";

export interface NumericImageryIndicatorsProps extends Indicator {
  resource: ResourceImageryTile;
}

export const NumericImageryIndicators = ({ id, resource }: NumericImageryIndicatorsProps) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryImageryTileId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => {
    if (!query.data || !("statistics" in query.data)) return 0;
    // const h = query.data.histograms[0];
    return query.data.statistics.reduce((acc, curr) => {
      return acc + (curr.sum ?? 0);
    }, 0);
  }, [query.data]);

  return (
    <CardLoader query={[query]} className="h-12 grow">
      <CardWidgetNumber value={VALUE} />
    </CardLoader>
  );
};
