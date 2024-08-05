"use client";

import { useMemo, useRef } from "react";

import { DeckLayer } from "@deck.gl/arcgis";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";

import { env } from "@/env.mjs";

import { useSyncGridFilters } from "@/app/store";

import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";

export const getGridLayerProps = ({
  gridFilters,
  colorscale,
}: {
  gridFilters: Record<string, number[]> | null;
  colorscale: CHROMA.Scale<CHROMA.Color>;
}) => {
  return new H3TileLayer({
    id: "tile-h3s",
    data: "https://dev.api.amazonia360.dev-vizzuality.com/grid/tile/{h3index}?columns=PMEAN",
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
    minZoom: 0,
    maxZoom: 12,
    maxRequests: 10, // max simultaneous requests. Set 0 for unlimited
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      gridFilters: gridFilters ? gridFilters : {},
    },
    renderSubLayers: (props) => {
      return new H3HexagonLayer<{
        cell: string;
        PMEAN: number;
        FRECF: number;
      }>({
        id: props.id,
        data: props.data,
        highPrecision: true,
        // coverage: 1.001,
        pickable: true,
        wireframe: false,
        filled: true,
        extruded: false,
        // LINE
        // stroked: true,
        // getLineColor: [100, 100, 100, 0],
        // getLineWidth: 1,
        // lineWidthUnits: "pixels",

        getHexagon: (d) => {
          const res = BigInt(d.cell);
          return res.toString(16);
        },
        getFillColor: (d) => {
          return colorscale(d.PMEAN).rgb();
        },
        opacity: 0.8,
      });
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [gridFilters] = useSyncGridFilters();

  const colorscale = useMemo(() => {
    return CHROMA.scale("viridis").domain([0, 35]);
  }, []);

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [getGridLayerProps({ gridFilters, colorscale })],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({ gridFilters, colorscale }),
    ];

    return GRID_LAYER.current;
  }, [gridFilters, colorscale]);

  return <Layer index={0} layer={layer} />;
}
