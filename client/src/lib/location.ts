import { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";

import { useGetFeatures } from "@/lib/query";
import { useGetSearch } from "@/lib/search";

import { CustomLocation, Location, SearchLocation } from "@/app/parsers";

import { DATASETS } from "@/constants/datasets";

import { AdministrativeBoundary } from "@/containers/widgets/overview/administrative-boundaries/types";

export const POINT_BUFFER = 60;

export const POLYLINE_BUFFER = 30;

export const useLocation = (location?: Location | null) => {
  const { data: searchData } = useGetSearch(
    location?.type === "search" ? (location as SearchLocation) : null,
    {
      enabled: location?.type === "search",
    },
  );

  return useMemo(() => {
    if (location?.type === "search" && searchData) {
      const geo = getGeometryByType({
        type: searchData.type,
        geometry: searchData.geometry,
      });

      if (!geo) return null;

      const graphic = new Graphic({
        geometry: geo,
      });
      return graphic;
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

export const useLocationTitle = (location?: Location | null) => {
  const { data: searchData } = useGetSearch(
    location?.type === "search" ? (location as SearchLocation) : null,
    {
      enabled: location?.type === "search",
    },
  );

  return useMemo(() => {
    if (location?.type === "search" && searchData) {
      return location.text;
    }

    if (location?.type && location?.type !== "search") {
      return "Custom Area";
    }

    return null;
  }, [location, searchData]);
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

export const useLocationGadm = (location?: Location | null) => {
  const GEOMETRY = useLocationGeometry(location);

  const query = useGetFeatures(
    {
      query: DATASETS.admin2.getFeatures({
        ...(!!GEOMETRY && {
          geometry: GEOMETRY,
        }),
      }),
      feature: DATASETS.admin2.layer,
    },
    {
      enabled: !!DATASETS.admin2.getFeatures && !!GEOMETRY,
      select(data): {
        gid0: string[];
        // gid1: string[];
        // gid2: string[];
      } {
        const attributes: AdministrativeBoundary[] = data.features.map(
          (f) => f.attributes,
        );
        return {
          gid0: Array.from(new Set(attributes.map((f) => f.GID_0)).values()),
          // gid1: Array.from(new Set(attributes.map((f) => f.GID_1)).values()),
          // gid2: Array.from(new Set(attributes.map((f) => f.GID_2)).values()),
        };
      },
    },
  );

  return query;
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

export const getGeometryWithBuffer = (
  geometry: __esri.Geometry | null,
): __esri.Polygon | null => {
  if (!geometry) return null;

  if (geometry.type === "point") {
    const g = geometryEngine.geodesicBuffer(
      geometry,
      POINT_BUFFER,
      "kilometers",
    );

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry.type === "polyline") {
    const g = geometryEngine.geodesicBuffer(
      geometry,
      POLYLINE_BUFFER,
      "kilometers",
    );

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry.type === "polygon") {
    return geometry as __esri.Polygon;
  }

  return null;
};
