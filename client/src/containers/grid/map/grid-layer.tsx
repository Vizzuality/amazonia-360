"use client";

import { useMemo, useRef, useState } from "react";

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";
import { DeckLayer } from "@deck.gl/arcgis";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";

import { env } from "@/env.mjs";

import { useGetGridMeta } from "@/lib/grid";

import { useSyncGridDatasets, useSyncGridFilters } from "@/app/store";

import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";
import { useMap } from "@/components/map/provider";

export const getGridLayerProps = ({
  gridDatasets,
  gridFilters,
  colorscale,
  zoom,
}: {
  gridDatasets: string[];
  gridFilters: Record<string, number[]> | null;
  colorscale: CHROMA.Scale<CHROMA.Color>;
  zoom: number;
}) => {
  const columns = gridDatasets.map((d) => `columns=${d}`).join("&");

  return new H3TileLayer({
    id: "tile-h3s",
    data: `https://dev.api.amazonia360.dev-vizzuality.com/grid/tile/{h3index}?${columns}`,
    getTileData: (tile) => {
      if (!tile.url) return Promise.resolve(null);
      return load(tile.url, ArrowLoader, {
        arrow: { shape: "arrow-table" },
        fetch: {
          headers: {
            Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
          },
        },
      }).then((data) => {
        return data.data;
      });
    },
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      gridDatasets,
      gridFilters: gridFilters ? gridFilters : {},
    },
    renderSubLayers: (props) => {
      return new H3HexagonLayer<Record<string, number>, { cell: string }>({
        id: props.id,
        data: props.data,
        highPrecision: true,
        // coverage: 1.001,
        pickable: true,
        wireframe: false,
        filled: !!gridDatasets.length,
        extruded: false,
        // LINE
        stroked: true,
        getLineColor: [0, 154, 222, 255],
        getLineWidth: () => {
          if (zoom <= 7) return 0.5;
          return 1;
        },
        lineWidthUnits: "pixels",

        getHexagon: (d) => {
          const res = BigInt(d.cell);
          return res.toString(16);
        },
        getFillColor: (d) => {
          const currentFilters = (gridFilters || {})[gridDatasets[0]];

          if (currentFilters) {
            const value = d[`${gridDatasets[0]}`];

            if (value < currentFilters[0] || value > currentFilters[1]) {
              return [0, 0, 0, 0];
            }
          }

          return colorscale(d[`${gridDatasets[0]}`]).rgb();
        },
        opacity: 1,
        updateTriggers: {
          getLineWidth: [zoom],
          getFillColor: [gridDatasets, gridFilters],
        },
      });
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
      const dataset = gridMetaData.datasets.find(
        (dataset) => dataset.var_name === g,
      );

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

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [
          getGridLayerProps({
            gridDatasets,
            gridFilters,
            colorscale,
            zoom,
          }),
        ],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({
        gridDatasets,
        gridFilters,
        colorscale,
        zoom,
      }),
    ];

    return GRID_LAYER.current;
  }, [gridDatasets, gridFilters, colorscale, zoom]);

  // Listen to extent changes
  ArcGISReactiveUtils.when(
    () => map?.view!.zoom,
    (z) => {
      setZoom(() => z);
    },
  );

  return <Layer index={0} layer={layer} />;
}
