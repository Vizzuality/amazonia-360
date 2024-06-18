"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { DeckLayer } from "@deck.gl/arcgis";
import { H3HexagonLayer } from "@deck.gl/geo-layers/typed";
import { ScatterplotLayer } from "@deck.gl/layers/typed";
import { scaleSequential } from "@visx/vendor/d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";
import { cellToLatLng } from "h3-js";
import { useAtom } from "jotai";
import { useDebounce } from "rooks";

import { tmpBboxAtom, useSyncBbox } from "@/app/store";

import Controls from "@/components/map/controls";
import BasemapControl from "@/components/map/controls/basemap";
import ZoomControl from "@/components/map/controls/zoom";
import Layer from "@/components/map/layers";
import H3TileLayer from "@/components/map/layers/h3-tile-layer";

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapContainer() {
  const [bbox, setBbox] = useSyncBbox();
  const [tmpBbox] = useAtom(tmpBboxAtom);

  const handleMapMove = useDebounce((extent: __esri.Extent) => {
    setBbox([extent.xmin, extent.ymin, extent.xmax, extent.ymax]);
  }, 500);

  const colorscale = scaleSequential()
    .domain([0, 5])
    // .domain([selectedLayer.min_value, selectedLayer.max_value])
    .interpolator(interpolateViridis);

  const layer = useMemo(() => {
    return new DeckLayer({
      "deck.layers": new H3TileLayer({
        id: "tile-h3s",
        data: "https://dev.api.amazonia360.dev-vizzuality.com/grid/tile/{h3index}",
        getTileData: (tile) => {
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
        renderSubLayers: (props) => {
          // For zoom < 1 (~whole world view), render a scatterplot layer instead of the hexagon layer
          // It is faster to render points than hexagons (is it?) when there are many cells.
          if (props.tile.zoom < 1) {
            return new ScatterplotLayer({
              id: props.id,
              data: props.data,
              pickable: true,
              radiusUnits: "meters",
              getRadius: 9854, // is the radius of a h3 cell at resolution 5 in meters
              getPosition: (d) =>
                cellToLatLng(BigInt(d.cell).toString(16)).reverse(),
              getFillColor: (d) => {
                const c = color(colorscale(d.fire)).rgb();
                return [c.r, c.g, c.b];
              },
              opacity: 0.8,
            });
          }
          return new H3HexagonLayer({
            id: props.id,
            data: props.data,
            highPrecision: "auto",
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
              const c = color(colorscale(d.fire)).rgb();
              return [c.r, c.g, c.b];
            },
            opacity: 0.8,
          });
        },
      }),
    });
  }, []);

  return (
    <div className="w-full flex flex-col grow">
      <Map
        id="default"
        defaultBbox={bbox}
        bbox={tmpBbox}
        onMapMove={handleMapMove}
        padding={{
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <Layer index={0} layer={layer} />

        <Controls>
          <ZoomControl />
          <BasemapControl />
        </Controls>
      </Map>
    </div>
  );
}
