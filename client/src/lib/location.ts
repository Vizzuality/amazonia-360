import { useEffect, useMemo, useState } from "react";

import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";
import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Graphic from "@arcgis/core/Graphic";
import { useTranslations } from "next-intl";

import { useGetFeatures } from "@/lib/query";
import { useGetSearch } from "@/lib/search";

import { Location, SearchLocation } from "@/app/(frontend)/parsers";

import { DATASETS } from "@/constants/datasets";
import { BUFFERS } from "@/constants/map";

if (!projectOperator.isLoaded()) {
  await projectOperator.load();
}

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
  const t = useTranslations();

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
      return t("selected-area");
    }

    return null;
  }, [location, searchData, t]);
};

const srKeyOf = (
  outSpatialReference?: __esri.SpatialReference | __esri.SpatialReferenceProperties,
): number | string | null =>
  (outSpatialReference as __esri.SpatialReferenceProperties | undefined)?.wkid ??
  (outSpatialReference as __esri.SpatialReferenceProperties | undefined)?.wkt ??
  null;

// Buffering + projecting runs ArcGIS's geodesicBuffer (now async/off-thread).
// `useLocationGeometry` is consumed by ~29 components, so without a shared cache the
// same buffer is recomputed once per component on every location change. Cache the
// in-flight *promise* by (geometry, buffer, target spatial reference) so concurrent
// consumers share a single computation and later renders read the resolved value.
const MAX_GEOMETRY_CACHE_ENTRIES = 50;
const bufferedGeometryCache = new Map<string, Promise<__esri.Polygon | null>>();

const getBufferedProjectedGeometry = (
  geometry: __esri.GeometryUnion,
  buffer: number,
  outSpatialReference?: __esri.SpatialReference | __esri.SpatialReferenceProperties,
): Promise<__esri.Polygon | null> => {
  const geometryJSON = geometry.toJSON();
  const srKey = srKeyOf(outSpatialReference) ?? geometry.spatialReference?.wkid ?? 102100;
  const cacheKey = JSON.stringify({ g: geometryJSON, buffer, srKey });

  const cached = bufferedGeometryCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const buffered = await getGeometryWithBuffer(geometry, buffer);
    if (!buffered) return null;

    const SR = new SpatialReference(
      (outSpatialReference as __esri.SpatialReferenceProperties) ||
        geometry.spatialReference?.toJSON() || { wkid: 102100 },
    );
    const projectedGeom = projectOperator.execute(buffered, SR);
    return (Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom) as __esri.Polygon;
  })().catch((error) => {
    // Don't cache failures, so a transient worker error can be retried.
    bufferedGeometryCache.delete(cacheKey);
    throw error;
  });

  if (bufferedGeometryCache.size >= MAX_GEOMETRY_CACHE_ENTRIES) {
    const oldest = bufferedGeometryCache.keys().next().value;
    if (oldest !== undefined) bufferedGeometryCache.delete(oldest);
  }
  bufferedGeometryCache.set(cacheKey, promise);

  return promise;
};

// Same as `useLocationGeometry` but also reports whether the buffer is still being
// computed off-thread, so callers can show a loader. `useLocationGeometry` delegates
// here and drops the flag, keeping its many consumers unchanged.
export const useLocationGeometryWithStatus = (
  location?: Location | null,
  outSpatialReference?: __esri.SpatialReference | __esri.SpatialReferenceProperties,
) => {
  const LOCATION = useLocation(location);

  // Most call sites pass an inline `{ wkid: 4326 }` literal, which is a new object
  // every render. Depending on its identity would re-run the buffer on every render,
  // so key the effect on its wkid/wkt instead of object identity.
  const outSpatialReferenceKey = srKeyOf(outSpatialReference);

  // The buffer is computed asynchronously (off the main thread), so the geometry
  // resolves after render. Consumers that gate queries on `!!GEOMETRY` simply wait.
  const [GEOMETRY, setGEOMETRY] = useState<__esri.Polygon | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const geometry = LOCATION?.geometry;
    if (!geometry) {
      setGEOMETRY(null);
      setIsCalculating(false);
      return;
    }

    let cancelled = false;
    const b = location?.type !== "search" ? location?.buffer : BUFFERS[geometry.type];
    const buffer = b || BUFFERS[geometry.type];

    setIsCalculating(true);
    getBufferedProjectedGeometry(geometry, buffer, outSpatialReference)
      .then((geometry) => {
        if (!cancelled) setGEOMETRY(geometry);
      })
      .catch(() => {
        if (!cancelled) setGEOMETRY(null);
      })
      .finally(() => {
        if (!cancelled) setIsCalculating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LOCATION, location, outSpatialReferenceKey]);

  return { geometry: GEOMETRY, isCalculating };
};

export const useLocationGeometry = (
  location?: Location | null,
  outSpatialReference?: __esri.SpatialReference | __esri.SpatialReferenceProperties,
) => useLocationGeometryWithStatus(location, outSpatialReference).geometry;

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

// Runs ArcGIS's *asynchronous* geodesicBuffer, which offloads the work to a worker
// instead of blocking the main thread. Buffering a long (~887 km) polyline densifies
// the offset curve into thousands of vertices and took ~700 ms synchronously, freezing
// the UI on upload. Keep this async so callers await it off the render path.
export const getGeometryWithBuffer = async (
  geometry: __esri.GeometryUnion | null,
  buffer: number,
): Promise<__esri.Polygon | null> => {
  if (!geometry) return null;

  if (geometry.type === "point" || geometry.type === "polyline") {
    const g = await geometryEngineAsync.geodesicBuffer(geometry, buffer, "kilometers");

    return Array.isArray(g) ? g[0] : g;
  }

  if (geometry.type === "polygon") {
    return geometry as __esri.Polygon;
  }

  return null;
};
