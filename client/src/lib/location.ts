import { useMemo } from "react";

import { geodesicBuffer } from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import { project } from "@arcgis/core/geometry/projection";
import Graphic from "@arcgis/core/Graphic";

import { useGetFeatures } from "@/lib/query";
import { useGetSearch } from "@/lib/search";

import { Location, SearchLocation } from "@/app/(frontend)/parsers";

import { DATASETS } from "@/constants/datasets";
import { BUFFERS } from "@/constants/map";

export type AdministrativeBoundary = {
  FID: string | number;
  GID_0: string;
  NAME_1: string;
  NAME_2: string;
  TYPE_2: string;
  NAME_0: string;
  TYPE_1: string;
  COMPNAME: string;
  ASQKM: number;
  POPGHS25: number;
  DENS: number;
  Shape__Area: number;
  Shape__Length: number;
};

export type City = {
  FID: string;
  ID_0: string;
  ISO: string;
  NAME_0: string;
  NAME_1: string;
  NAME_2: string;
  NOMBCAP: string;
  COMPNAME: string;
};

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
        buffer: BUFFERS[searchData.type],
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
      return "Selected area";
    }

    return null;
  }, [location, searchData]);
};

export const useLocationGeometry = (
  location?: Location | null,
  outSpatialReference?: __esri.SpatialReference | __esri.SpatialReferenceProperties,
) => {
  const LOCATION = useLocation(location);

  const GEOMETRY = useMemo(() => {
    if (LOCATION) {
      const b = location?.type !== "search" ? location?.buffer : BUFFERS[LOCATION.geometry.type];
      const g = getGeometryWithBuffer(LOCATION.geometry, b || BUFFERS[LOCATION.geometry.type]);

      if (!g) return null;

      const projectedGeom = project(
        g,
        outSpatialReference || LOCATION.geometry.spatialReference || { wkid: 102100 },
      );

      const geom = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

      return geom as __esri.Polygon;
    }

    return null;
  }, [LOCATION, location, outSpatialReference]);

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
        const attributes: AdministrativeBoundary[] = data.features.map((f) => f.attributes);
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

export const getGeometryByType = (location: Location) => {
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
  buffer: number,
): __esri.Polygon | null => {
  if (!geometry) return null;

  if (geometry.type === "point") {
    const g = geodesicBuffer(geometry, buffer, "kilometers");

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry.type === "polyline") {
    const g = geodesicBuffer(geometry, buffer, "kilometers");

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry.type === "polygon") {
    return geometry as __esri.Polygon;
  }

  return null;
};
