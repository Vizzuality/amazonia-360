import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetIndicatorsId, useQueryImageryId } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import { Indicator, ResourceImagery } from "@/types/indicator";

import { useSyncLocation } from "@/app/(frontend)/store";

import { CardLoader, CardWidgetNumber } from "@/containers/card";
import { useIndicator } from "@/containers/indicators/provider";

export interface NumericImageryIndicatorsProps extends Indicator {
  resource: ResourceImagery;
  isPdf?: boolean;
}

export const NumericImageryIndicators = ({
  id,
  resource,
  description_short,
  isPdf,
}: NumericImageryIndicatorsProps) => {
  const locale = useLocale();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location);

  const { onIndicatorViewLoading, onIndicatorViewLoaded, onIndicatorViewError } = useIndicator();

  const indicator = useGetIndicatorsId(id, locale);

  const query = useQueryImageryId({ id, resource, type: "numeric", geometry: GEOMETRY });

  const VALUE = useMemo(() => {
    if (!query.data || !("statistics" in query.data)) return null;

    const [s] = query.data.statistics;

    if (!s) return 0;

    if ("sum" in s) return s.sum;

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

    return query.data?.histograms?.reduce((acc, curr) => {
      return (
        acc +
        [...curr.counts].reduce((a, c, i) => {
          return a + c * (curr.min + (i * curr.max) / (curr.size - 1));
        }, 0)
      );
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
