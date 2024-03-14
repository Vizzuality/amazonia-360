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

export const getGeometryWithBuffer = (graphic: __esri.Graphic | null) => {
  if (graphic?.geometry?.type === "point") {
    const g = geometryEngine.geodesicBuffer(graphic.geometry, 30, "kilometers");

    return Array.isArray(g) ? g[0] : g;
  }

  if (graphic?.geometry?.type === "polygon") {
    return graphic.geometry;
  }

  return null;
};

export const useLocationGeometry = (location?: Location | null) => {
  const LOCATION = useLocation(location);

  const GEOMETRY = useMemo(() => {
    if (LOCATION) {
      return getGeometryWithBuffer(LOCATION);
    }

    return null;
  }, [LOCATION]);

  return GEOMETRY;
};
