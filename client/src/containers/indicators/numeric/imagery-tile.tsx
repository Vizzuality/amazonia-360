import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId, useQueryImageryTileId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";

import { Indicator, ResourceImageryTile } from "@/app/local-api/indicators/route";
import { useSyncLocation } from "@/app/store";

import { CardLoader, CardWidgetNumber } from "@/containers/card";

export interface NumericImageryTileIndicatorsProps extends Indicator {
  resource: ResourceImageryTile;
}

export const NumericImageryTileIndicators = ({
  id,
  resource,
}: NumericImageryTileIndicatorsProps) => {
  const locale = useLocale();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);
  const indicator = useGetIndicatorsId(id, locale);

  const query = useQueryImageryTileId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => {
    if (!query.data || !("statistics" in query.data)) return null;

    const [s] = query.data.statistics;

    if (!s) return 0;

    if ("sum" in s) return s.sum;

    // This is not used anymore unless we need to calculate the sum from the histogram
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

    return (
      query.data?.histograms?.reduce((acc, curr) => {
        return (
          acc +
          [...curr.counts].reduce((a, c, i) => {
            return a + c * (curr.min + (i * curr.max) / (curr.size - 1));
          }, 0)
        );
      }, 0) ?? "-"
    );
  }, [query.data]);

  return (
    <CardLoader query={[query]} className="h-12 grow">
      <CardWidgetNumber value={VALUE ?? "n.d."} unit={!!VALUE ? indicator?.unit : undefined} />
    </CardLoader>
  );
};
