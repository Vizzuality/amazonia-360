"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
import { DeckLayer } from "@deck.gl/arcgis";
import { Accessor, Color } from "@deck.gl/core";
import { DataFilterExtension, DataFilterExtensionProps } from "@deck.gl/extensions";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";

import { env } from "@/env.mjs";

import { useGetGridMeta } from "@/lib/grid";

import { MultiDatasetMeta } from "@/types/generated/api.schemas";

import { useSyncGridDatasets, useSyncGridFilters } from "@/app/store";

import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";
import { useMap } from "@/components/map/provider";

export const getGridLayerProps = ({
  gridDatasets,
  gridFilters,
  getFillColor,
  gridMetaData,
  zoom,
}: {
  gridDatasets: string[];
  gridFilters: Record<string, number[]> | null;
  getFillColor: Accessor<Record<string, number>, Color>;
  gridMetaData: MultiDatasetMeta | undefined;
  zoom: number;
}) => {
  const columns = !!gridDatasets.length ? gridDatasets.map((d) => `columns=${d}`).join("&") : "";

  return new H3TileLayer({
    id: `tile-h3s-${columns.toString()}`,
    data: `https://dev.api.amazonia360.dev-vizzuality.com/grid/tile/{h3index}?${columns}`,
    getTileData: (tile) => {
      if (!tile.url) return Promise.resolve(null);
      return load(tile.url, ArrowLoader, {
        arrow: { shape: "arrow-table" },
        // arrow: { shape: "object-row-table" },
        fetch: {
          headers: {
            Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
          },
        },
      }).then((data) => {
        return Object.assign(data.data, {
          length: data.data.numRows,
        });
      });
    },
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      gridDatasets,
      gridFilters: gridFilters ? gridFilters : {},
    },
    renderSubLayers: (props) => {
      if (!props.data) {
        return null;
      }

      const filterRange = () => {
        if (gridDatasets.length === 1) {
          const [d] = gridDatasets;
          const legend = gridMetaData?.datasets.find((dataset) => dataset.var_name === d)?.legend;

          if (legend?.legend_type === "continuous") {
            const stats = legend?.stats?.find((s) => s.level === 1);

            return (gridFilters?.[d] || [stats?.min, stats?.max]) as [number, number];
          }
        }

        return gridDatasets.map((d) => {
          const legend = gridMetaData?.datasets.find((dataset) => dataset.var_name === d)?.legend;

          if (legend?.legend_type === "continuous") {
            const stats = legend?.stats?.find((s) => s.level === 1);

            return (gridFilters?.[d] || [stats?.min, stats?.max]) as [number, number];
          }

          return [1, 100] as [number, number];
        });
      };

      const filterSize = () => {
        return Math.min(gridDatasets.length, 4) as 0 | 1 | 2 | 3 | 4;
      };

      return [
        new H3HexagonLayer<
          {
            cell: number;
            [key: string]: number;
          },
          DataFilterExtensionProps
        >({
          id: props.id,
          data: props.data,
          highPrecision: false,
          opacity: 1,
          pickable: true,
          filled: !!gridDatasets.length,
          extruded: false,
          stroked: false,
          getFillColor,
          getHexagon: (d) => `${d.cell}`,
          getFilterValue: (d) => {
            if (gridDatasets.length === 1) {
              return d[`${gridDatasets[0]}`];
            }

            return gridDatasets.map((dataset) => d[`${dataset}`]);
          },
          extensions: [new DataFilterExtension({ filterSize: filterSize() })],
          filterRange: filterRange(),
          updateTriggers: {
            getFillColor: [gridDatasets],
            getFilterValue: [gridDatasets],
          },
        }),
        new H3HexagonLayer({
          id: `${props.id}-grid`,
          data: props.data,
          highPrecision: false,
          pickable: false,
          filled: false,
          extruded: false,
          // LINE
          stroked: true,
          getLineColor: [0, 154, 222, 255],
          getLineWidth: () => {
            return (1 - zoom) / 5;
          },
          lineWidthUnits: "pixels",
          getHexagon: (d) => `${d.cell}`,
          opacity: 1,
          updateTriggers: {
            getLineWidth: [zoom],
          },
        }),
      ];
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const map = useMap();
  const [zoom, setZoom] = useState(map?.view.zoom || 0);
  const [gridFilters] = useSyncGridFilters();
  const [gridDatasets] = useSyncGridDatasets();

  const { data: gridMetaData } = useGetGridMeta();

  const colorscale = useMemo(() => {
    if (!gridMetaData) return CHROMA.scale([]);

    if (gridDatasets.length === 0) return CHROMA.scale([]);

    if (gridDatasets.length === 1) {
      const [g] = gridDatasets;
      const dataset = gridMetaData.datasets.find((dataset) => dataset.var_name === g);

      if (dataset?.legend.legend_type === "continuous") {
        const s = dataset.legend.stats.find((stat) => stat.level === 1);

        return CHROMA.scale(dataset.legend.colormap_name as string).domain([
          s?.min || 0,
          s?.max || 100,
        ]);
      }
    }

    return CHROMA.scale("viridis").domain([0, 35]);
  }, [gridDatasets, gridMetaData]);

  const getFillColor = useCallback(
    (d: Record<string, number>): Color => {
      if (gridDatasets.length === 1) {
        const [dataset] = gridDatasets;

        return colorscale(d[`${dataset}`]).rgb();
      }

      if (gridDatasets.length > 1) {
        return [0, 100, 200, 255];
      }

      return [0, 0, 0, 0];
    },
    [gridDatasets, colorscale],
  );

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [
          getGridLayerProps({
            gridDatasets,
            gridFilters,
            gridMetaData,
            zoom,
            getFillColor,
          }),
        ],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({
        gridDatasets,
        gridFilters,
        gridMetaData,
        zoom,
        getFillColor,
      }),
    ];

    return GRID_LAYER.current;
  }, [gridDatasets, gridFilters, getFillColor, gridMetaData, zoom]);

  // Listen to extent changes
  ArcGISReactiveUtils.when(
    () => map?.view!.zoom,
    (z) => {
      setZoom(() => z);
    },
  );

  return <Layer index={0} layer={layer} />;
}
