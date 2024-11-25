/**
 * Generated by orval v6.31.0 🍺
 * Do not edit manually.
 * Amazonia360 API
 * OpenAPI spec version: 0.1.0
 */
import { API } from "../../services/api";

import type {
  BodyReadTableGridTablePost,
  Feature,
  GridTileGridTileTileIndexGetParams,
  GridTileInAreaGridTileTileIndexPostParams,
  MultiDatasetMeta,
  ReadTableGridTablePostParams,
  TableResults,
} from "./api.schemas";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Get a tile of h3 cells with specified data columns
 * @summary Get a grid tile
 */
export const gridTileGridTileTileIndexGet = (
  tileIndex: string,
  params?: GridTileGridTileTileIndexGetParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<string>({ url: `/grid/tile/${tileIndex}`, method: "GET", params }, options);
};
/**
 * Get a tile of h3 cells that are inside the polygon
 * @summary Get a grid tile with cells contained inside the GeoJSON
 */
export const gridTileInAreaGridTileTileIndexPost = (
  tileIndex: string,
  feature: Feature,
  params?: GridTileInAreaGridTileTileIndexPostParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<string>(
    {
      url: `/grid/tile/${tileIndex}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: feature,
      params,
    },
    options,
  );
};
/**
 * Get the grid dataset metadata
 * @summary Dataset metadata
 */
export const gridDatasetMetadataGridMetaGet = (options?: SecondParameter<typeof API>) => {
  return API<MultiDatasetMeta>({ url: `/grid/meta`, method: "GET" }, options);
};
/**
 * Query tile dataset and return table data
 * @summary Read Table
 */
export const readTableGridTablePost = (
  bodyReadTableGridTablePost: BodyReadTableGridTablePost,
  params: ReadTableGridTablePostParams,
  options?: SecondParameter<typeof API>,
) => {
  return API<TableResults>(
    {
      url: `/grid/table`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: bodyReadTableGridTablePost,
      params,
    },
    options,
  );
};
export type GridTileGridTileTileIndexGetResult = NonNullable<
  Awaited<ReturnType<typeof gridTileGridTileTileIndexGet>>
>;
export type GridTileInAreaGridTileTileIndexPostResult = NonNullable<
  Awaited<ReturnType<typeof gridTileInAreaGridTileTileIndexPost>>
>;
export type GridDatasetMetadataGridMetaGetResult = NonNullable<
  Awaited<ReturnType<typeof gridDatasetMetadataGridMetaGet>>
>;
export type ReadTableGridTablePostResult = NonNullable<
  Awaited<ReturnType<typeof readTableGridTablePost>>
>;
