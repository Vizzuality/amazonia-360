"use client";

import { useCallback, useMemo, useRef } from "react";

import * as projection from "@arcgis/core/geometry/projection";
import { DeckLayer } from "@deck.gl/arcgis";
import { Accessor, Color } from "@deck.gl/core";
import { DataFilterExtension, DataFilterExtensionProps } from "@deck.gl/extensions";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";

import { env } from "@/env.mjs";

import { useGetGridMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";

import { MultiDatasetMeta } from "@/types/generated/api.schemas";

import { useSyncGridDatasets, useSyncGridFilters, useSyncLocation } from "@/app/store";

import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";

export const getGridLayerProps = ({
  gridDatasets,
  gridFilters,
  getFillColor,
  gridMetaData,
  geometry,
}: {
  gridDatasets: string[];
  gridFilters: Record<string, number[]> | null;
  getFillColor: Accessor<Record<string, number>, Color>;
  gridMetaData: MultiDatasetMeta | undefined;
  geometry: __esri.Polygon | null;
}) => {
  // Create array of 4n values
  const filters = [...Array(4).keys()];
  const columns = !!gridDatasets.length ? gridDatasets.map((d) => `columns=${d}`).join("&") : "";

  let geom = null;

  if (geometry) {
    const projectedGeom = projection.project(geometry, {
      wkid: 4326,
    });

    geom = Array.isArray(projectedGeom) ? projectedGeom[0] : projectedGeom;
  }

  return new H3TileLayer({
    id: `tile-h3s`,
    data: `https://dev.api.amazonia360.dev-vizzuality.com/grid/tile/{h3index}?${columns}`,
    extent: [-85.3603, -28.5016, -29.8134, 10.8038],
    getTileData: (tile) => {
      if (!tile.url) return Promise.resolve(null);
      return load(tile.url, ArrowLoader, {
        arrow: { shape: "arrow-table" },
        // arrow: { shape: "object-row-table" },
        fetch: {
          method: !!geom ? "POST" : "GET",
          ...(!!geom && {
            body: JSON.stringify({
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: geom?.toJSON().rings,
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
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      gridDatasets,
      gridFilters: gridFilters ? gridFilters : {},
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
          id: props.id,
          data: props.data,
          highPrecision: true,
          opacity: 1,
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
          },
        }),
        new H3HexagonLayer({
          id: `${props.id}-grid`,
          data: props.data,
          highPrecision: true,
          opacity: 1,
          pickable: false,
          filled: false,
          extruded: false,
          // HEXAGON
          getHexagon: (d) => `${d.cell}`,
          // LINE
          stroked: true,
          getLineColor: [0, 154, 222, 255],
          getLineWidth: 1,
          lineWidthUnits: "pixels",
        }),
      ];
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [location] = useSyncLocation();
  const [gridFilters] = useSyncGridFilters();
  const [gridDatasets] = useSyncGridDatasets();

  const GEOMETRY = useLocationGeometry(location);

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
            getFillColor,
            geometry: GEOMETRY,
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
        getFillColor,
        geometry: GEOMETRY,
      }),
    ];

    return GRID_LAYER.current;
  }, [gridDatasets, gridFilters, getFillColor, gridMetaData, GEOMETRY]);

  return <Layer index={0} layer={layer} />;
}
