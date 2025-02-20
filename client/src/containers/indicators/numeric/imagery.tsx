import { useMemo } from "react";

import { useGetIndicatorsId, useQueryImageryTileId } from "@/lib/indicators";
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
  const indicator = useGetIndicatorsId(id);

  const query = useQueryImageryTileId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => {
    if (!query.data || !("statistics" in query.data)) return 0;

    // let sumproducto = 0;
    // let countPixel = 0;
    // for (let i=0; i<hs.histograms[0].size; i++) {
    //     let valor_histo_i = (hs.histograms[0].min + i * hs.histograms[0].max/(hs.histograms[0].size-1))
    //     console.log(hs.histograms[0].counts[i], "px X", valor_histo_i);
    //     producto = hs.histograms[0].counts[i] * valor_histo_i;
    //     sumproducto += producto
    //     countPixel += hs.histograms[0].counts[i]
    //     console.log(sumproducto);
    // }
    // console.log(sumproducto)
    // console.log(countPixel)
    // const h = query.data.histograms[0];

    return query.data.histograms.reduce((acc, curr) => {
      return (
        acc +
        [...curr.counts].reduce((a, c, i) => {
          return a + c * (curr.min + (i * curr.max) / (curr.size - 1));
        }, 0)
      );
    }, 0);
  }, [query.data]);

  return (
    <CardLoader query={[query]} className="h-12 grow">
      <CardWidgetNumber value={VALUE} unit={indicator?.unit_en} />
    </CardLoader>
  );
};
