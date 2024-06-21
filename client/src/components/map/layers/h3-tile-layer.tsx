// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { TileLayer, _Tileset2D as Tileset2D } from "@deck.gl/geo-layers";
import bbox from "@turf/bbox";
import { lineString } from "@turf/helpers";
import {
  cellToBoundary,
  cellToParent,
  edgeLength,
  getResolution,
  latLngToCell,
  originToDirectedEdges,
  polygonToCells,
} from "h3-js";

/** Fills the viewport bbox polygon(s) with h3 cells */
function fillViewportBBoxes(bboxes: number[][], tileRes: number) {
  let cells: string[] = [];
  for (const bbox of bboxes) {
    const poly = [
      [bbox[0], bbox[1]],
      [bbox[0], bbox[3]],
      [bbox[2], bbox[3]],
      [bbox[2], bbox[1]],
      [bbox[0], bbox[1]],
    ];
    cells = cells.concat(polygonToCells(poly, tileRes, true));
  }
  return cells;
}

/** Splits viewport bounds into two if span is > 180 and adds buffer to include border hexagons.
 * Also clamps viewport bounds to the world bounds [-+180, -+90], which maybe backfires if used in GlobeView
 * */
function makeBufferedBounds(bounds: number[], tileRes: number) {
  // getHexagonEdgeLengthAvg for a given resolution doesn't have "rads"
  // as a unit option, even that the docs say it does >:(.
  // So will use random edge from the central cell as an edge length proxy since it doesn't need to be exact.
  const medLat = (bounds[1] + bounds[3]) / 2;
  const medLng = (bounds[0] + bounds[2]) / 2;
  const centroidCellEdges = originToDirectedEdges(
    latLngToCell(medLat, medLng, tileRes),
  );
  // largest edge from the center cell of the viewport
  const buffer =
    (Math.max(...centroidCellEdges.map((x) => edgeLength(x, "rads"))) * 180) /
    Math.PI;
  bounds[0] = Math.max(bounds[0] - buffer, -180); // min X
  bounds[1] = Math.max(bounds[1] - buffer, -90); // min Y
  bounds[2] = Math.min(bounds[2] + buffer, 180); // max X
  bounds[3] = Math.min(bounds[3] + buffer, 90); // max Y
  // polygons spanning more than 180 degrees need to be split in two parts to be correctly covered by h3
  // https://github.com/uber/h3-js/issues/180#issuecomment-1652453683
  // So split the bounds in two parts
  if (bounds[2] - bounds[0] > 180) {
    const bounds2 = [...bounds];
    const xSplitPoint = (bounds[2] - bounds[0]) / 2;
    // new min and max X at split point
    bounds[2] -= xSplitPoint;
    bounds2[0] += xSplitPoint;
    return [bounds, bounds2];
  } else {
    return [bounds];
  }
}

export class H3Tileset2D extends Tileset2D {
  /** Returns true if the tile is visible in the current viewport
   * FIXME: Should be adapted to h3 tiles. How? no idea...
   * */
  isTileVisible(tile, cullRect) {
    return super.isTileVisible(tile, cullRect);
  }

  /** Returns the tile indices that are needed to cover the viewport
   * It tries to get a sensible number of tiles by computing the h3 resolution
   * that will be used to cover the viewport in h3 cells.
   * If the number of cells is too high,
   * it decreases the resolution until the number of cells is below a threshold.
   * */
  getTileIndices(opts) {
    // let tileRes = Math.max(Math.floor(opts.viewport.zoom / 2 - 1), 0);
    let tileRes = 0;

    if (
      typeof opts.minZoom === "number" &&
      Number.isFinite(opts.minZoom) &&
      tileRes < opts.minZoom
    ) {
      if (!opts.extent) {
        return [];
      }

      tileRes = opts.minZoom;
    }

    if (
      typeof opts.maxZoom === "number" &&
      Number.isFinite(opts.maxZoom) &&
      tileRes > opts.maxZoom
    ) {
      tileRes = opts.maxZoom;
    }
    const bufferedBounds = makeBufferedBounds(
      opts.viewport.getBounds(),
      tileRes,
    );
    const cells = fillViewportBBoxes(bufferedBounds, tileRes);
    return cells.map((h3index) => ({ h3index: h3index }));
  }

  getTileId({ h3index }) {
    return h3index;
  }

  getTileZoom({ h3index }) {
    return getResolution(h3index);
  }

  getParentIndex({ h3index }) {
    const res = getResolution(h3index);
    // FIXME: this return raises a type warning in the ide which expects an object like
    //  {x: number, y: number, z: number} and I don't know how to patch this type to {h3index: string}
    return { h3index: cellToParent(h3index, res - 1) };
  }

  /** Returns the tile's bounding box
   * Needed for setting BoundingBox in Tile2DHeader (aka tile param in getTileData of TileLayer)
   * */
  getTileMetadata({ h3index }) {
    const cell_bbox = bbox(lineString(cellToBoundary(h3index, true)));
    // bbox is [minX, minY, maxX, maxY]
    return {
      bbox: {
        west: cell_bbox[0],
        north: cell_bbox[3],
        east: cell_bbox[2],
        south: cell_bbox[1],
      },
    };
  }
}

export default class H3TileLayer extends TileLayer {}
H3TileLayer.defaultProps = {
  TilesetClass: H3Tileset2D,
};
H3TileLayer.layerName = "H3TileLayer";
