export const BASEMAPS = [
  {
    id: "gray-vector",
    label: "basemap-gray",
  },
  {
    id: "dark-gray-vector",
    label: "basemap-dark-gray",
  },
  {
    id: "satellite",
    label: "basemap-satellite",
  },
  {
    id: "streets",
    label: "basemap-streets",
  },
  {
    id: "hybrid",
    label: "basemap-hybrid",
  },
  {
    id: "osm",
    label: "basemap-osm",
  },
  {
    id: "topo-vector",
    label: "basemap-topographic",
  },
  {
    id: "terrain",
    label: "basemap-terrain",
  },
] as const;
export type BasemapIds = (typeof BASEMAPS)[number]["id"];
