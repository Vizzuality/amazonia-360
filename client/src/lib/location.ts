import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import { useGetSearch } from "@/lib/search";

import { Location, SearchLocation } from "@/app/parsers";

export const useLocation = (location?: Location | null) => {
  const { data: featureData } = useGetSearch(location as SearchLocation, {
    enabled: location?.type === "search",
  });

  return useMemo(() => {
    if (location?.type === "search" && featureData) {
      return featureData.results[0].results[0].feature;
    }

    // if (location?.type === "custom") {
    //   return [
    //     new Graphic({
    //       geometry: new Polygon({
    //         rings: location.GEOMETRY.rings,
    //       }),
    //     }),
    //   ];
    // }

    return null;
  }, [location, featureData]);
};

export const useLocationGeometry = (location?: Location | null) => {
  const LOCATION = useLocation(location);

  const GEOMETRY = useMemo(() => {
    if (LOCATION?.geometry?.type === "point") {
      const g = geometryEngine.geodesicBuffer(
        LOCATION.geometry,
        30,
        "kilometers",
      );

      return Array.isArray(g) ? g[0] : g;
    }

    if (LOCATION?.geometry?.type === "polygon") {
      return LOCATION.geometry;
    }

    return null;
  }, [LOCATION]);

  return GEOMETRY;
};
