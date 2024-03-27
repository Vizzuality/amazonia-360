import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

export const DEFAULT_MAP_VIEW_PROPERTIES: __esri.MapViewProperties = {
  extent: {
    xmin: -84.34627596688159,
    ymin: -25.38670960349323,
    xmax: -32.060183541373306,
    ymax: 14.481895073924633,
    spatialReference: {
      wkid: 4326,
    },
  },

  constraints: {
    minZoom: 3, // The minimum allowed zoom level of the view.
  },
} satisfies __esri.MapViewProperties;

export const POINT_SYMBOL = new SimpleMarkerSymbol({
  color: "#004E70",
  style: "circle",
  size: 10,
  outline: {
    color: "#004E70",
    width: 1,
  },
});

export const POLYLINE_SYMBOL = new SimpleLineSymbol({
  color: "#004E70",
  width: 1,
});

export const POLYGON_SYMBOL = new SimpleFillSymbol({
  color: "#196E8C11",
  outline: {
    color: "#004E70",
    width: 1,
  },
});

export const BUFFER_SYMBOL = new SimpleFillSymbol({
  color: "#196E8C11",
  style: "solid",
  outline: {
    width: 1,
    style: "short-dash",
    color: "#004E70",
  },
});

export const SYMBOLS = {
  point: POINT_SYMBOL,
  polyline: POLYLINE_SYMBOL,
  polygon: POLYGON_SYMBOL,
  mesh: POLYGON_SYMBOL,
  extent: BUFFER_SYMBOL,
  multipoint: POINT_SYMBOL,
  multipolygon: POLYGON_SYMBOL,
} as const;
