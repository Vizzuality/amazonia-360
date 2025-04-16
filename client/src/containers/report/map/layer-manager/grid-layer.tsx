"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import Point from "@arcgis/core/geometry/Point";
import * as projection from "@arcgis/core/geometry/projection";
import { DeckLayer } from "@deck.gl/arcgis";
import { Accessor, Color, PickingInfo } from "@deck.gl/core";
import { DataFilterExtension, DataFilterExtensionProps } from "@deck.gl/extensions";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowTable } from "@loaders.gl/arrow";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";
import { cellToLatLng, latLngToCell } from "h3-js";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useMeta } from "@/lib/grid";
import { getGeometryWithBuffer, useLocationGeometry } from "@/lib/location";

import { MultiDatasetMeta } from "@/types/generated/api.schemas";

import {
  gridHoverAtom,
  gridCellHighlightAtom,
  useSyncGridDatasets,
  useSyncGridFilters,
  useSyncGridFiltersSetUp,
  useSyncGridSelectedDataset,
  useSyncLocation,
  GridHoverType,
  tmpBboxAtom,
} from "@/app/store";

import { BUFFERS } from "@/constants/map";

import H3TileLayer from "@/components/map/layers/h3-tile-layer";
import { useMap } from "@/components/map/provider";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export const getGridLayerProps = ({
  gridDatasets,
  gridFilters,
  gridSelectedDataset,
  opacity,
  getFillColor,
  gridMetaData,
  geometry,
  zoom,
  gridHover,
  setGridHover,
  gridCellHighlight,
  onCellClick,
}: {
  gridDatasets: string[];
  gridFilters: Record<string, number[] | Record<string, string | number>> | null;
  gridSelectedDataset: string | null;
  opacity: number;
  getFillColor: Accessor<Record<string, number>, Color>;
  gridMetaData: MultiDatasetMeta | undefined;
  geometry: __esri.Polygon | null;
  zoom?: number;
  gridHover: GridHoverType;
  setGridHover: (props: GridHoverType) => void;
  gridCellHighlight?: string;
  onCellClick?: (info: PickingInfo) => void;
}) => {
  // Create array of 4n values
  const filters = [...Array(4).keys()];
  const columns = !!gridDatasets.length ? gridDatasets.map((d) => `columns=${d}`).join("&") : "";

  return new H3TileLayer({
    id: `tile-h3s`,
    data: `/custom-api/grid/tile/{h3index}?${columns}`,
    extent: [-80.3603, -36.5016, -43.8134, 20.8038],
    visible: !!gridDatasets.length && gridSelectedDataset !== "no-layer",
    getTileData: (tile) => {
      if (!tile.url) return Promise.resolve(null);
      return load(tile.url, ArrowLoader, {
        arrow: { shape: "arrow-table" },
        // arrow: { shape: "object-row-table" },
        fetch: {
          method: !!geometry ? "POST" : "GET",
          ...(!!geometry && {
            body: JSON.stringify({
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: geometry?.toJSON().rings,
              },
            }),
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      }).then((data) => {
        return Object.assign(data.data, {
          length: data.data.numRows,
        });
      });
    },
    pickable: true,
    onClick: (info: PickingInfo) => {
      if (onCellClick) onCellClick(info);
    },
    onHover: (info: PickingInfo) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const table = info?.tile?.content as ArrowTable["data"];
      const row = table?.get(info.index);
      const values = gridDatasets.map((column) => ({
        column,
        value: row?.[column],
      }));

      if (info && info.index === -1) {
        // setHoveredCell(null);
        setGridHover({
          id: null,
          cell: undefined,
          index: undefined,
          values: [],
          x: null,
          y: null,
          coordinates: undefined,
        });
      }

      if (info && info.index !== -1 && info.coordinate) {
        const cell = latLngToCell(info?.coordinate?.[1], info.coordinate[0], 6);
        setGridHover({
          id: info.index,
          cell,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          index: info.sourceLayer?.props?.tile?.index?.h3index,
          values,
          x: info.x,
          y: info.y,
          coordinates: info.coordinate,
        });
      }
    },
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      gridDatasets,
      gridFilters: gridFilters ? gridFilters : {},
    },
    updateTriggers: {
      getTileData: [geometry],
      opacity: [opacity],
    },
    renderSubLayers: (props) => {
      if (!props.data) {
        return null;
      }

      const getFilterValue: Accessor<Record<string, number>, number[]> = (d) => {
        return filters.map((f) => {
          if (gridDatasets[f]) {
            return d[`${gridDatasets[f]}`];
          }

          return 0;
        });
      };

      const filterRange = () => {
        return filters.map((f) => {
          if (gridDatasets[f]) {
            const legend = gridMetaData?.datasets.find(
              (dataset) => dataset.var_name === gridDatasets[f],
            )?.legend;

            if (legend?.legend_type === "continuous" && "stats" in legend) {
              const stats = legend?.stats?.find((s) => s.level === 1);

              return (gridFilters?.[gridDatasets[f]] || [stats?.min, stats?.max]) as [
                number,
                number,
              ];
            }

            return [-1, 1] as [number, number];
          }

          return [-1, 1] as [number, number];
        });
      };
      return [
        new H3HexagonLayer<
          {
            cell: number;
            [key: string]: number;
          },
          DataFilterExtensionProps
        >({
          ...props,
          id: `${props.id}-${opacity}`,
          data: props.data,
          highPrecision: true,
          opacity,
          pickable: true,
          filled: !!gridDatasets.length,
          extruded: false,
          stroked: false,
          getHexagon: (d) => `${d.cell}`,
          getFillColor,
          getFilterValue,
          filterRange: filterRange(),

          extensions: [
            new DataFilterExtension({
              filterSize: filters.length as 0 | 1 | 2 | 3 | 4,
            }),
          ],
          updateTriggers: {
            getFillColor: [getFillColor],
            getFilterValue: [gridDatasets],
            opacity: [opacity],
          },
        }),
        new H3HexagonLayer({
          ...props,
          id: `${props.id}-grid-${opacity}`,
          data: props.data,
          highPrecision: true,
          opacity: opacity,
          visible: zoom && zoom < 8 ? false : true,
          pickable: true,
          filled: false,
          extruded: false,
          // HEXAGON
          getHexagon: (d) => `${d.cell}`,
          // LINE
          stroked: true,
          getLineColor: [0, 154, 222, 255],
          getLineWidth: 1,
          lineWidthUnits: "pixels",
          updateTriggers: {
            getLineColor: [zoom],
            opacity: [opacity],
          },
        }),
        new H3HexagonLayer({
          ...props,
          id: `${props.id}-grid-highlight-${opacity}`,
          data: [gridCellHighlight, gridHover.cell].filter(Boolean),
          highPrecision: true,
          opacity: opacity,
          visible: !!gridCellHighlight || gridHover.cell ? true : false,
          pickable: false,
          filled: true,
          extruded: false,
          // HEXAGON
          getHexagon: (d) => d,
          // LINE
          stroked: true,
          getFillColor: [0, 220, 0, 255],
          getLineColor: [0, 220, 255, 255],
          getLineWidth: 3,
          lineWidthUnits: "pixels",
          updateTriggers: {
            opacity: [opacity],
          },
        }),
      ];
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [location, setLocation] = useSyncLocation();
  const [gridFilters] = useSyncGridFilters();
  const [gridSetUpFilters] = useSyncGridFiltersSetUp();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();
  const gridCellHighlight = useAtomValue(gridCellHighlightAtom);
  const [gridHover, setGridHover] = useAtom(gridHoverAtom);
  const setTmpBbox = useSetAtom(tmpBboxAtom);

  const map = useMap();
  const [zoom, setZoom] = useState(map?.view.zoom);

  map?.view.watch("zoom", setZoom);
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { META: gridMetaData } = useMeta(GEOMETRY);

  const colorscale = useMemo(() => {
    if (!gridMetaData) return CHROMA.scale([]);

    if (!gridSelectedDataset) return CHROMA.scale([]);

    if (gridSelectedDataset) {
      const dataset = gridMetaData.datasets.find(
        (dataset) => dataset.var_name === gridSelectedDataset,
      );

      if (dataset?.legend.legend_type === "continuous" && "stats" in dataset.legend) {
        const s = dataset.legend.stats.find((stat) => stat.level === 1);

        return CHROMA.scale("viridis").domain([s?.min || 0, s?.max || 100]);
      }
    }

    return CHROMA.scale("viridis").domain([0, 100]);
  }, [gridSelectedDataset, gridMetaData]);

  const getFillColor = useCallback(
    (d: Record<string, number>): Color => colorscale(d[`${gridSelectedDataset}`]).rgb(),
    [gridSelectedDataset, colorscale],
  );

  const onCellClick = useCallback(
    (info: PickingInfo) => {
      if (!info?.coordinate) return;
      const cell = latLngToCell(info?.coordinate?.[1], info.coordinate[0], 6);

      const latLng = cellToLatLng(cell);

      const p = new Point({
        x: latLng[1],
        y: latLng[0],
        spatialReference: { wkid: 4326 },
      });
      const projectedGeom = projection.project(p, { wkid: 102100 });
      const g = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;

      setLocation({
        type: "point",
        geometry: g.toJSON(),
        buffer: BUFFERS.point,
      });

      const gWithBuffer = getGeometryWithBuffer(g, BUFFERS.point);
      if (gWithBuffer) {
        setTmpBbox(gWithBuffer.extent);
      }
    },
    [setLocation, setTmpBbox],
  );

  const opacity = useMemo(() => gridSetUpFilters.opacity * 0.01, [gridSetUpFilters]);

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [
          getGridLayerProps({
            gridDatasets,
            gridFilters,
            gridSelectedDataset,
            gridMetaData,
            getFillColor,
            opacity,
            geometry: GEOMETRY,
            zoom,
            gridHover,
            setGridHover,
            gridCellHighlight: gridCellHighlight.index,
            onCellClick,
          }),
        ],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({
        gridDatasets,
        gridFilters,
        gridSelectedDataset,
        gridMetaData,
        getFillColor,
        opacity,
        geometry: GEOMETRY,
        zoom,
        gridHover,
        setGridHover,
        gridCellHighlight: gridCellHighlight.index,
        onCellClick,
      }),
    ];

    return GRID_LAYER.current;
  }, [
    gridDatasets,
    gridFilters,
    gridSelectedDataset,
    gridMetaData,
    getFillColor,
    opacity,
    GEOMETRY,
    zoom,
    gridHover,
    setGridHover,
    gridCellHighlight,
    onCellClick,
  ]);

  return (
    <>
      <Layer index={0} layer={layer} />
    </>
  );
}
