"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import { Card, CardLoader, CardTitle } from "@/containers/card";
import WidgetEnvironmentSummaryBiomes from "@/containers/widgets/environment/summary/biomes";
import WidgetEnvironmentSummaryClimate from "@/containers/widgets/environment/summary/climate";
import WidgetEnvironmentSummaryHydro from "@/containers/widgets/environment/summary/hydro";

export default function WidgetEnvironmentSummary() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  const queryHydro = useGetFeatures({
    feature: DATASETS.cuencas_hidrograficas.layer,
    query: DATASETS.cuencas_hidrograficas.getFeatures({
      ...(!!GEOMETRY && {
        geometry: GEOMETRY,
      }),
    }),
  });

  const queryClimate = useGetFeatures({
    feature: DATASETS.tipos_climaticos.layer,
    query: DATASETS.tipos_climaticos.getFeatures({
      ...(!!GEOMETRY && {
        geometry: GEOMETRY,
      }),
    }),
  });

  const queryBiomes = useGetFeatures({
    feature: DATASETS.biomas.layer,
    query: DATASETS.biomas.getFeatures({
      ...(!!GEOMETRY && {
        geometry: GEOMETRY,
      }),
    }),
  });

  return (
    <Card>
      <CardTitle>Environment summary</CardTitle>
      <CardLoader
        query={[queryHydro, queryClimate, queryBiomes]}
        className="h-28"
      >
        {!!queryHydro.data && (
          <p className="text-sm font-medium">
            The region is situated within an altitude range of 200-500 meters.{" "}
            <WidgetEnvironmentSummaryClimate query={queryClimate} />{" "}
            <WidgetEnvironmentSummaryHydro query={queryHydro} />.{" "}
            <WidgetEnvironmentSummaryBiomes query={queryBiomes} />.
          </p>
        )}
      </CardLoader>
    </Card>
  );
}
