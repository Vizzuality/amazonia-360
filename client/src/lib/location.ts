import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";

import { useGetSearch } from "@/lib/search";

import { CustomLocation, Location, SearchLocation } from "@/app/parsers";

export const useLocation = (location?: Location | null) => {
  const { data: searchData } = useGetSearch(
    location?.type === "search" ? (location as SearchLocation) : null,
    {
      enabled: location?.type === "search",
    },
  );

  return useMemo(() => {
    if (location?.type === "search" && searchData) {
      return searchData.results[0].results[0].feature;
    }

    if (location?.type && location?.type !== "search") {
      const geo = getGeometryByType(location);

      if (!geo) return null;

      const graphic = new Graphic({
        geometry: geo,
      });
      return graphic;
    }

    return null;
  }, [location, searchData]);
};

export const getGeometryByType = (location: CustomLocation) => {
  if (location?.type === "point") {
    return Point.fromJSON(location.geometry);
  }

  if (location?.type === "polygon") {
    return Polygon.fromJSON(location.geometry);
  }

  if (location?.type === "polyline") {
    return Polyline.fromJSON(location.geometry);
  }

  return null;
};

export const getGeometryWithBuffer = (geometry: __esri.Geometry | null) => {
  if (geometry?.type === "point") {
    const g = geometryEngine.geodesicBuffer(geometry, 30, "kilometers");

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry?.type === "polyline") {
    const g = geometryEngine.geodesicBuffer(geometry, 3, "kilometers");

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry?.type === "polygon") {
    return geometry;
  }

  return null;
};

export const useLocationGeometry = (location?: Location | null) => {
  const LOCATION = useLocation(location);

  const GEOMETRY = useMemo(() => {
    if (LOCATION) {
      return getGeometryWithBuffer(LOCATION.geometry);
    }

    return null;
  }, [LOCATION]);

  return GEOMETRY;
};
