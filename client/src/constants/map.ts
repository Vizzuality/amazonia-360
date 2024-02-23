export const DEFAULT_MAP_VIEW_PROPERTIES = {
  extent: {
    xmin: -84.34627596688159,
    ymin: -25.38670960349323,
    xmax: -32.060183541373306,
    ymax: 14.481895073924633,
  },

  constraints: {
    minZoom: 3, // The minimum allowed zoom level of the view.
  },
} satisfies __esri.MapViewProperties;
