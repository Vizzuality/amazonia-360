"use client";

import { useMemo, useRef } from "react";

import { DeckLayer } from "@deck.gl/arcgis";
import { DataFilterExtension } from "@deck.gl/extensions/typed";
import { H3HexagonLayer } from "@deck.gl/geo-layers/typed";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";

import { useSyncPopulation } from "@/app/store";

import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";

export const getGridLayerProps = ({ population, colorscale }) => {
  return new H3TileLayer({
    id: "tile-h3s",
    data: "https://dev.api.amazonia360.dev-vizzuality.com/grid/tile/{h3index}",
    getTileData: (tile) => {
      if (!tile.url) return Promise.resolve(null);
      return load(tile.url, ArrowLoader, {
        arrow: { shape: "object-row-table" },
      }).then((data) => {
        return data.data;
      });
    },
    minZoom: 0,
    maxZoom: 12,
    maxRequests: 10, // max simultaneous requests. Set 0 for unlimited
    maxCacheSize: 300, // max number of tiles to keep in the cache
    _subLayerProps: {
      population,
    },
    renderSubLayers: (props) => {
      return new H3HexagonLayer({
        id: props.id,
        data: props.data,
        highPrecision: true,
        // coverage: 1.001,
        pickable: true,
        wireframe: false,
        filled: true,
        extruded: false,
        stroked: false,
        // getLineColor: [255, 255, 255, 255],
        // getLineWidth:  10,
        getHexagon: (d) => {
          const res = BigInt(d.cell);
          return res.toString(16);
        },
        getFillColor: (d) => {
          return colorscale(d.population).rgb();
        },
        opacity: 0.8,
        extensions: [new DataFilterExtension({ filterSize: 1 })],
        filterRange: population,
        getFilterValue: (d) => [d.population],
      });
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [population] = useSyncPopulation();

  const colorscale = useMemo(() => {
    return CHROMA.scale("Viridis").domain([1, 10000]);
  }, []);

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [getGridLayerProps({ population, colorscale })],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({ population, colorscale }),
    ];

    return GRID_LAYER.current;
  }, [colorscale, population]);

  return <Layer index={0} layer={layer} />;
}
