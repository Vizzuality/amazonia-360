import { useMemo } from "react";

import { useQueryImageryTileId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceImageryTile } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader } from "@/containers/card";

export interface NumericImageryIndicatorsProps extends Indicator {
  resource: ResourceImageryTile;
}

export const NumericImageryIndicators = ({ id, resource }: NumericImageryIndicatorsProps) => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const query = useQueryImageryTileId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const DATA = useMemo(() => {
    if (!query.data) return [];

    // const h = query.data.histograms[0];
    // const s = query.data.statistics[0];

    console.log(query.data);
  }, [query.data]);

  console.log(DATA);

  return (
    <CardLoader query={[query]} className="h-12 grow">
      Hello
    </CardLoader>
  );
};
