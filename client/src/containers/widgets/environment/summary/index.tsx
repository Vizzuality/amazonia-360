"use client";

import { useLocationGeometry } from "@/lib/location";
import { useGetFeatures } from "@/lib/query";

import { useSyncLocation } from "@/app/store";

import { DATASETS } from "@/constants/datasets";

import {
  Card,
  CardContent,
  CardHeader,
  CardInfo,
  CardLoader,
  CardTitle,
} from "@/containers/card";
import WidgetEnvironmentSummaryBiomes from "@/containers/widgets/environment/summary/biomes";
import WidgetEnvironmentSummaryClimate from "@/containers/widgets/environment/summary/climate";
import WidgetEnvironmentSummaryHydro from "@/containers/widgets/environment/summary/hydro";

export default function WidgetEnvironmentSummary() {
  const [location] = useSyncLocation();

  const GEOMETRY = useLocationGeometry(location);

  // const queryAltitude = useGetRasterAnalysis(
  //   {
  //     id: "elevation_ranges",
  //     polygon: GEOMETRY,
  //     statistics: ["frac", "unique"],
  //   },
  //   {
  //     enabled: !!GEOMETRY,

  //     select(data) {
  //       const values = data.features.map((f) => {
  //         if (f.properties.unique && f.properties.frac) {
  //           const { frac, unique } = f.properties;

  //           const us = unique.map((u, index) => {
  //             const e = ELEVATION_RANGES[`${u}` as ElevationRangeIds];
  //             return {
  //               id: u,
  //               x: frac[index],
  //               y: e.range[1],
  //               label: e.label,
  //               color: e.color,
  //             };
  //           }, {});

  //           return us.toSorted((a, b) => {
  //             if (!a.id || !b.id) return 0;

  //             return a.id - b.id;
  //           });
  //         }

  //         return [];
  //       });

  //       return values.flat();
  //     },
  //   },
  // );

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
      <CardHeader>
        <CardTitle>Environment summary</CardTitle>
        <CardInfo
          ids={["tipos_climaticos", "cuencas_hidrograficas", "biomas"]}
        />
      </CardHeader>

      <CardContent>
        <CardLoader
          query={[queryHydro, queryClimate, queryBiomes]}
          className="h-28"
        >
          <p className="text-sm font-medium">
            {/* <WidgetEnvironmentSummaryAltitude query={queryAltitude} />.{" "} */}
            <WidgetEnvironmentSummaryClimate query={queryClimate} />.{" "}
            <WidgetEnvironmentSummaryHydro query={queryHydro} />.{" "}
            <WidgetEnvironmentSummaryBiomes query={queryBiomes} />.
          </p>
        </CardLoader>
      </CardContent>
    </Card>
  );
}
