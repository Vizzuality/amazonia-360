import { useMemo } from "react";

import Polygon from "@arcgis/core/geometry/Polygon";
import Graphic from "@arcgis/core/Graphic";

import { useGetFeaturesId } from "@/lib/query";

import { Location } from "@/app/parsers";

import { DATASETS } from "@/constants/datasets";

export const useLocation = (location: Location | null) => {
  const { data: featureData } = useGetFeaturesId(
    {
      id: location?.type === "feature" ? location.FID : null,
      query:
        location?.type === "feature"
          ? DATASETS[`${location?.SOURCE}`].getFeatures({
              returnGeometry: true,
            })
          : undefined,
      feature:
        location?.type === "feature"
          ? DATASETS[`${location?.SOURCE}`].layer
          : undefined,
    },
    {
      enabled:
        location?.type === "feature" &&
        !!DATASETS[`${location?.SOURCE}`].getFeatures &&
        !!location.FID,
      select: (data) => data.features,
    },
  );

  return useMemo(() => {
    if (location?.type === "feature" && featureData) {
      return featureData;
    }

    if (location?.type === "custom") {
      return [
        new Graphic({
          geometry: new Polygon({
            rings: location.GEOMETRY.rings,
          }),
        }),
      ];
    }

    return [];
  }, [location, featureData]);
};
