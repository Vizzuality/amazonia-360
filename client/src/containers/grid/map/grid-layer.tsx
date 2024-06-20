"use client";

import { useMemo, useRef } from "react";

import { DeckLayer } from "@deck.gl/arcgis";
import { DataFilterExtension, DataFilterExtensionProps } from "@deck.gl/extensions";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { ArrowLoader } from "@loaders.gl/arrow";
import { load } from "@loaders.gl/core";
import CHROMA from "chroma-js";

import { useSyncFires, useSyncPopulation } from "@/app/store";

import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";

export const getGridLayerProps = ({ population, fires, colorscale }: {
  population: number[];
  fires: number[];
  colorscale: any;
}) => {
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
      return new H3HexagonLayer<{
        cell: string;
        population: number;
        fire: number;
      }, DataFilterExtensionProps<{
        population: number;
        fire: number;
      }>>({
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
        extensions: [new DataFilterExtension({ filterSize: 1, categorySize: 1 })],
        filterRange: population as [number, number] | [number, number][],
        filterCategories: fires,
        getFilterValue: (d) => [d.population],
        getFilterCategory: (d) => {
          return [d.fire];
        },
      });
    },
  });
};

export default function GridLayer() {
  const GRID_LAYER = useRef<typeof DeckLayer>();
  const [population] = useSyncPopulation();
  const [fires] = useSyncFires();

  const colorscale = useMemo(() => {
    return CHROMA.scale("Viridis").domain([1, 10000]);
  }, []);

  const layer = useMemo(() => {
    if (!GRID_LAYER.current) {
      GRID_LAYER.current = new DeckLayer({
        "deck.layers": [getGridLayerProps({ population, fires, colorscale })],
      });

      return GRID_LAYER.current;
    }

    GRID_LAYER.current.deck.layers = [
      getGridLayerProps({ population, fires, colorscale }),
    ];

    return GRID_LAYER.current;
  }, [colorscale, population]);

  return <Layer index={0} layer={layer} />;
}
