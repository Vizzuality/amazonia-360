"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { DeckLayer } from "@deck.gl/arcgis";
import { Accessor, Color } from "@deck.gl/core";
import { DataFilterExtension, DataFilterExtensionProps } from "@deck.gl/extensions";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowTable } from "@loaders.gl/arrow";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";
import { latLngToCell } from "h3-js";
import { useAtomValue, useSetAtom } from "jotai";

import { env } from "@/env.mjs";

import { useGetGridMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { MultiDatasetMeta } from "@/types/generated/api.schemas";

import {
  popupInfoAtom,
  gridCellHighlightAtom,
  useSyncGridDatasets,
  useSyncGridFilters,
  useSyncGridFiltersSetUp,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import H3TileLayer from "@/components/map/layers/h3-tile-layer";
import { useMap } from "@/components/map/provider";

const Layer = dynamic(() => import("@/components/map/layers"), { ssr: false });

export const getGridLayerProps = ({
  gridDatasets,
  gridFilters,
  opacity,
  getFillColor,
  gridMetaData,
  geometry,
  zoom,
  setPopupInfo,
  hoveredCell,
  setHoveredCell,
  gridCellHighlight,
}: {
  gridDatasets: string[];
  gridFilters: Record<string, number[] | Record<string, string | number>> | null;
  opacity: number;
  getFillColor: Accessor<Record<string, number>, Color>;
  gridMetaData: MultiDatasetMeta | undefined;
  geometry: __esri.Polygon | null;
  zoom?: number;
  setPopupInfo: (info: {
    id: number | null;
    index: undefined | string;
    values: { column: string; value: string | number }[];
    x: number | null;
    y: number | null;
    coordinates: number[] | undefined;
  }) => void;
  hoveredCell: string | null;
  setHoveredCell: (arg: string | null) => void;
  gridCellHighlight?: string;
}) => {
  // Create array of 4n values
  const filters = [...Array(4).keys()];
  const columns = !!gridDatasets.length ? gridDatasets.map((d) => `columns=${d}`).join("&") : "";
  return new H3TileLayer({
    id: `tile-h3s`,
    data: `${env.NEXT_PUBLIC_API_URL}/grid/tile/{h3index}?${columns}`,
    extent: [-85.3603, -28.5016, -29.8134, 10.8038],
    visible: !!gridDatasets.length,
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
            Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
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
    onHover: (info) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const table = info?.tile?.content as ArrowTable["data"];
      const row = table?.get(info.index);
      const values = gridDatasets.map((column) => ({ column, value: row?.[column] }));

      if (info && info.index === -1) {
        setHoveredCell(null);
        setPopupInfo({
          id: null,
          index: undefined,
          values: [],
          x: null,
          y: null,
          coordinates: undefined,
        });
      }
      if (info && info.index !== -1 && info.coordinate) {
        const cell = latLngToCell(info?.coordinate?.[1], info.coordinate[0], 6);
        setHoveredCell(cell);
        setPopupInfo({
          id: info.index,
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

            if (legend?.legend_type === "continuous") {
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
            new DataFilterExtension({ filterSize: filters.length as 0 | 1 | 2 | 3 | 4 }),
          ],
          updateTriggers: {
            getFillColor: [gridDatasets],
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
          onHover: (x) => {
            console.info("hover from subLayer 2", { x });
          },
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
          data: [gridCellHighlight, hoveredCell].filter(Boolean),
          highPrecision: true,
          opacity: opacity,
          visible: !!gridCellHighlight || hoveredCell ? true : false,
          pickable: true,
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
            handleGridCellHighlight: [gridCellHighlight],
            gridCellHighlight: [gridCellHighlight],
            hoveredCell: [hoveredCell],
          },
        }),
      ];
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [location] = useSyncLocation();
  const [gridFilters] = useSyncGridFilters();
  const [gridSetUpFilters] = useSyncGridFiltersSetUp();
  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset] = useSyncGridSelectedDataset();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const gridCellHighlight = useAtomValue(gridCellHighlightAtom);
  const setPopupInfo = useSetAtom(popupInfoAtom);

  const map = useMap();
  const [zoom, setZoom] = useState(map?.view.zoom);

  map?.view.watch("zoom", setZoom);
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { data: gridMetaData } = useGetGridMeta();

  const colorscale = useMemo(() => {
    if (!gridMetaData) return CHROMA.scale([]);

    if (!gridSelectedDataset) return CHROMA.scale([]);

    if (gridSelectedDataset) {
      const dataset = gridMetaData.datasets.find(
        (dataset) => dataset.var_name === gridSelectedDataset,
      );

      if (dataset?.legend.legend_type === "continuous") {
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

  const opacity = useMemo(() => gridSetUpFilters.opacity * 0.01, [gridSetUpFilters]);

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [
          getGridLayerProps({
            gridDatasets,
            gridFilters,
            opacity,
            gridMetaData,
            getFillColor,
            setPopupInfo,
            geometry: GEOMETRY,
            zoom,
            hoveredCell,
            setHoveredCell,
            gridCellHighlight: gridCellHighlight.index,
          }),
        ],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({
        gridDatasets,
        gridFilters,
        opacity,
        gridMetaData,
        getFillColor,
        geometry: GEOMETRY,
        zoom,
        hoveredCell,
        setHoveredCell,
        setPopupInfo,
        gridCellHighlight: gridCellHighlight.index,
      }),
    ];

    return GRID_LAYER.current;
  }, [
    gridDatasets,
    gridFilters,
    getFillColor,

    gridMetaData,
    GEOMETRY,
    zoom,
    gridCellHighlight,
    opacity,
    hoveredCell,
    setHoveredCell,
    setPopupInfo,
  ]);

  return <Layer index={0} layer={layer} />;
}
