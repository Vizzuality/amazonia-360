/**
 * Generated by orval v6.31.0 🍺
 * Do not edit manually.
 * Amazonia360 API
 * OpenAPI spec version: 0.1.0
 */
import { API } from "../../services/api";

import type {
  ExactZonalStatsExactZonalStatsPostBody,
  ExactZonalStatsExactZonalStatsPostParams,
  ImageType,
  PointOutput,
  PointPointLonLatGetParams,
  StatsFeatures,
  TileJSON,
  TileTilesTileMatrixSetIdZXYFormatGetParams,
  TileTilesTileMatrixSetIdZXYGetParams,
  TileTilesTileMatrixSetIdZXYScaleXFormatGetParams,
  TileTilesTileMatrixSetIdZXYScaleXGetParams,
  TilejsonTileMatrixSetIdTilejsonJsonGetParams,
} from "./api.schemas";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Get Point value for a dataset.
 * @summary Point
 */
export const pointPointLonLatGet = (
  lon: number,
  lat: number,
  params: PointPointLonLatGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<PointOutput>({ url: `/point/${lon},${lat}`, method: "GET", params }, options);
};
/**
 * Compute the zonal statistics of a raster.

Powered by [`exact_extract`](https://github.com/isciences/exactextract).
 * @summary Exact Zonal Stats
 */
export const exactZonalStatsExactZonalStatsPost = (
  exactZonalStatsExactZonalStatsPostBody: ExactZonalStatsExactZonalStatsPostBody,
  params: ExactZonalStatsExactZonalStatsPostParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<StatsFeatures>(
    {
      url: `/exact_zonal_stats`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: exactZonalStatsExactZonalStatsPostBody,
      params,
    },
    options,
  );
};
/**
 * Create map tile from a dataset.
 * @summary Tile
 */
export const tileTilesTileMatrixSetIdZXYScaleXFormatGet = (
  tileMatrixSetId:
    | "CDB1GlobalGrid"
    | "CanadianNAD83_LCC"
    | "EuropeanETRS89_LAEAQuad"
    | "GNOSISGlobalGrid"
    | "LINZAntarticaMapTilegrid"
    | "NZTM2000Quad"
    | "UPSAntarcticWGS84Quad"
    | "UPSArcticWGS84Quad"
    | "UTM31WGS84Quad"
    | "WGS1984Quad"
    | "WebMercatorQuad"
    | "WorldCRS84Quad"
    | "WorldMercatorWGS84Quad",
  z: number,
  x: number,
  y: number,
  scale: number,
  format: ImageType,
  params: TileTilesTileMatrixSetIdZXYScaleXFormatGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<unknown>(
    { url: `/tiles/${tileMatrixSetId}/${z}/${x}/${y}@${scale}x.${format}`, method: "GET", params },
    options,
  );
};
/**
 * Create map tile from a dataset.
 * @summary Tile
 */
export const tileTilesTileMatrixSetIdZXYScaleXGet = (
  tileMatrixSetId:
    | "CDB1GlobalGrid"
    | "CanadianNAD83_LCC"
    | "EuropeanETRS89_LAEAQuad"
    | "GNOSISGlobalGrid"
    | "LINZAntarticaMapTilegrid"
    | "NZTM2000Quad"
    | "UPSAntarcticWGS84Quad"
    | "UPSArcticWGS84Quad"
    | "UTM31WGS84Quad"
    | "WGS1984Quad"
    | "WebMercatorQuad"
    | "WorldCRS84Quad"
    | "WorldMercatorWGS84Quad",
  z: number,
  x: number,
  y: number,
  scale: number,
  params: TileTilesTileMatrixSetIdZXYScaleXGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<unknown>(
    { url: `/tiles/${tileMatrixSetId}/${z}/${x}/${y}@${scale}x`, method: "GET", params },
    options,
  );
};
/**
 * Create map tile from a dataset.
 * @summary Tile
 */
export const tileTilesTileMatrixSetIdZXYFormatGet = (
  tileMatrixSetId:
    | "CDB1GlobalGrid"
    | "CanadianNAD83_LCC"
    | "EuropeanETRS89_LAEAQuad"
    | "GNOSISGlobalGrid"
    | "LINZAntarticaMapTilegrid"
    | "NZTM2000Quad"
    | "UPSAntarcticWGS84Quad"
    | "UPSArcticWGS84Quad"
    | "UTM31WGS84Quad"
    | "WGS1984Quad"
    | "WebMercatorQuad"
    | "WorldCRS84Quad"
    | "WorldMercatorWGS84Quad",
  z: number,
  x: number,
  y: number,
  format: ImageType,
  params: TileTilesTileMatrixSetIdZXYFormatGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<unknown>(
    { url: `/tiles/${tileMatrixSetId}/${z}/${x}/${y}.${format}`, method: "GET", params },
    options,
  );
};
/**
 * Create map tile from a dataset.
 * @summary Tile
 */
export const tileTilesTileMatrixSetIdZXYGet = (
  tileMatrixSetId:
    | "CDB1GlobalGrid"
    | "CanadianNAD83_LCC"
    | "EuropeanETRS89_LAEAQuad"
    | "GNOSISGlobalGrid"
    | "LINZAntarticaMapTilegrid"
    | "NZTM2000Quad"
    | "UPSAntarcticWGS84Quad"
    | "UPSArcticWGS84Quad"
    | "UTM31WGS84Quad"
    | "WGS1984Quad"
    | "WebMercatorQuad"
    | "WorldCRS84Quad"
    | "WorldMercatorWGS84Quad",
  z: number,
  x: number,
  y: number,
  params: TileTilesTileMatrixSetIdZXYGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<unknown>(
    { url: `/tiles/${tileMatrixSetId}/${z}/${x}/${y}`, method: "GET", params },
    options,
  );
};
/**
 * Return TileJSON document for a dataset.
 * @summary Tilejson
 */
export const tilejsonTileMatrixSetIdTilejsonJsonGet = (
  tileMatrixSetId:
    | "CDB1GlobalGrid"
    | "CanadianNAD83_LCC"
    | "EuropeanETRS89_LAEAQuad"
    | "GNOSISGlobalGrid"
    | "LINZAntarticaMapTilegrid"
    | "NZTM2000Quad"
    | "UPSAntarcticWGS84Quad"
    | "UPSArcticWGS84Quad"
    | "UTM31WGS84Quad"
    | "WGS1984Quad"
    | "WebMercatorQuad"
    | "WorldCRS84Quad"
    | "WorldMercatorWGS84Quad",
  params: TilejsonTileMatrixSetIdTilejsonJsonGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<TileJSON>(
    { url: `/${tileMatrixSetId}/tilejson.json`, method: "GET", params },
    options,
  );
};
/**
 * List all available tif files.
 * @summary List Files
 */
export const listFilesTifsGet = (options?: SecondParameter<typeof API>) => {
  return API<unknown>({ url: `/tifs`, method: "GET" }, options);
};
export type PointPointLonLatGetResult = NonNullable<
  Awaited<ReturnType<typeof pointPointLonLatGet>>
>;
export type ExactZonalStatsExactZonalStatsPostResult = NonNullable<
  Awaited<ReturnType<typeof exactZonalStatsExactZonalStatsPost>>
>;
export type TileTilesTileMatrixSetIdZXYScaleXFormatGetResult = NonNullable<
  Awaited<ReturnType<typeof tileTilesTileMatrixSetIdZXYScaleXFormatGet>>
>;
export type TileTilesTileMatrixSetIdZXYScaleXGetResult = NonNullable<
  Awaited<ReturnType<typeof tileTilesTileMatrixSetIdZXYScaleXGet>>
>;
export type TileTilesTileMatrixSetIdZXYFormatGetResult = NonNullable<
  Awaited<ReturnType<typeof tileTilesTileMatrixSetIdZXYFormatGet>>
>;
export type TileTilesTileMatrixSetIdZXYGetResult = NonNullable<
  Awaited<ReturnType<typeof tileTilesTileMatrixSetIdZXYGet>>
>;
export type TilejsonTileMatrixSetIdTilejsonJsonGetResult = NonNullable<
  Awaited<ReturnType<typeof tilejsonTileMatrixSetIdTilejsonJsonGet>>
>;
export type ListFilesTifsGetResult = NonNullable<Awaited<ReturnType<typeof listFilesTifsGet>>>;
