"use client";

// import { useLocationGeometry } from "@/lib/location";
// import { useGetRasterAnalysis } from "@/lib/query";

// import { useSyncLocation } from "@/app/store";

import { Card, CardTitle, CardWidgetNumber } from "@/containers/card";

export default function WidgetForestFires() {
  // const [location] = useSyncLocation();

  // const GEOMETRY = useLocationGeometry(location);

  // const query = useGetRasterAnalysis(
  //   {
  //     id: "fires",
  //     polygon: GEOMETRY,
  //     statistics: ["min", "max", "unique", "frac", "mean", "majority"],
  //   },
  //   {
  //     enabled: !!GEOMETRY,

  //     select(data) {
  //       const values = data.features.map((f) => {
  //         console.log(f.properties);
  //         // if (f.properties.unique && f.properties.frac) {
  //         //   const { frac, unique } = f.properties;

  //         //   const us = unique.map((u, index) => {
  //         //     return {
  //         //       id: LAND_COVER[`${u as LandCoverIds}`].label,
  //         //       parent: "root",
  //         //       size: frac[index],
  //         //       label: LAND_COVER[`${u as LandCoverIds}`].label,
  //         //       color: LAND_COVER[`${u as LandCoverIds}`].color,
  //         //     };
  //         //   }, {});

  //         //   return us
  //         //     .filter((u) => u.size > 0.001)
  //         //     .toSorted((a, b) => {
  //         //       if (!a.size || !b.size) return 0;

  //         //       return b.size - a.size;
  //         //     });
  //         // }

  //         return [];
  //       });

  //       return values.flat();
  //     },
  //   },
  // );

  return (
    <Card>
      <CardTitle>Frequency of forest fires</CardTitle>
      {/* <CardLoader
        query={[queryIndigenousLands, queryIndigenousLandsCoverage]}
        className="h-12"
      >
        <ArcChart value={queryIndigenousLandsCoverage.data?.percentage ?? 0} />
      </CardLoader> */}

      <CardWidgetNumber
        value={"Low"}
        subvalue="based on an estimate of fire points"
      />
    </Card>
  );
}
