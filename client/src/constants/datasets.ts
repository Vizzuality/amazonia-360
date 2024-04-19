import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Query from "@arcgis/core/rest/support/Query";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

import { env } from "@/env.mjs";

import { getKeys } from "@/lib/utils";

import {
  ELEVATION_RANGES_COLORMAP,
  FIRES_COLORMAP,
  LAND_COVER_COLORMAP,
} from "@/constants/raster";

export const DATASETS = {
  admin: {
    layer: new FeatureLayer({
      id: "admin",
      title: "Admin",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_ADM2/FeatureServer/0",
      renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: [0, 0, 0, 0.25],
          style: "solid",
          outline: {
            width: 1,
            color: [255, 255, 255, 1],
          },
        }),
      }),
    }),

    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  area_afp: {
    layer: new FeatureLayer({
      id: "area_afp",
      title: "Límite del área AFP",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_AREA_DE_TRABAJO_PANAMAZONIA/FeatureServer/0",
      renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: [0, 0, 0, 0],
          style: "solid",
          outline: {
            width: 1,
            color: "#004E70",
          },
        }),
      }),
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  ciudades_capitales: {
    layer: new FeatureLayer({
      id: "ciudades_capitales",
      title: "Ciudades capitales",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/0",
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          color: "#000000",
          size: 4,
          outline: {
            width: 1,
            color: "#000000",
          },
        }),
      }),
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  frontera_internacional: {
    layer: new FeatureLayer({
      id: "frontera_internacional",
      title: "Vectores frontera internacional",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/REFERENCIA_FRONTERA_INTERNACIONAL/FeatureServer/0",
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  tierras_indigenas: {
    layer: new FeatureLayer({
      id: "tierras_indigenas",
      title: "Indigenous lands",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tierras_indigenas/FeatureServer/0",
      renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: [227, 139, 79, 0.8],
          outline: {
            color: [230, 230, 230, 0.8],
            width: 1,
          },
        }),
      }),
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  tipos_climaticos: {
    layer: new FeatureLayer({
      id: "tipos_climaticos",
      title: "Tipos climáticos (Koepen)",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0",
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  biomas: {
    layer: new FeatureLayer({
      id: "biomas",
      title: "Biomas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0",
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  ecosistemas: {
    layer: new FeatureLayer({
      id: "ecosistemas",
      title: "Ecosistemas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Ecosistemas/FeatureServer/0",
      renderer: new UniqueValueRenderer({
        field: "BIOME",
        defaultSymbol: new SimpleFillSymbol({
          color: [227, 139, 79, 0.8],
          outline: {
            color: [230, 230, 230, 0.8],
            width: 1,
          },
        }),
        uniqueValueInfos: [
          {
            value: 1,
            symbol: new SimpleFillSymbol({
              color: [0, 0, 255, 0.8],
              outline: {
                color: [0, 230, 230, 0.8],
                width: 1,
              },
            }),
          },
          {
            value: 2,
            symbol: new SimpleFillSymbol({
              color: [0, 255, 0, 0.8],
              outline: {
                color: [230, 0, 230, 0.8],
                width: 1,
              },
            }),
          },
          {
            value: 3,
            symbol: new SimpleFillSymbol({
              color: [255, 0, 0, 0.8],
              outline: {
                color: [230, 230, 0, 0.8],
                width: 1,
              },
            }),
          },
          {
            value: 4,
            symbol: new SimpleFillSymbol({
              color: [255, 255, 0, 0.8],
              outline: {
                color: [230, 0, 0, 0.8],
                width: 1,
              },
            }),
          },
          {
            value: 5,
            symbol: new SimpleFillSymbol({
              color: [255, 0, 255, 0.8],
              outline: {
                color: [0, 230, 0, 0.8],
                width: 1,
              },
            }),
          },
        ],
      }),
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  cuencas_hidrograficas: {
    layer: new FeatureLayer({
      id: "cuencas_hidrograficas",
      title: "Cuenca hidrográfica, pertenencia a grandes cuencas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0",
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  areas_protegidas: {
    layer: new FeatureLayer({
      id: "areas_protegidas",
      title: "Protected areas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0",
      renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: "#cadcc5",
          outline: {
            color: "#b5b986",
            width: 1,
          },
        }),
      }),
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  institutional_tracking: {
    layer: new FeatureLayer({
      id: "institutional_tracking",
      title: "Institutional Tracking",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Institutional_Tracking/FeatureServer/0",
      featureReduction: {
        type: "cluster",
        clusterMinSize: 16.5,
        labelingInfo: [
          {
            deconflictionStrategy: "none",
            labelExpressionInfo: {
              expression: "Text($feature.cluster_count, '#,###')",
            },
            symbol: {
              type: "text",
              color: "#FFFFFF",
              font: {
                size: "12px",
              },
            },
            labelPlacement: "center-center",
          },
        ],
      },
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          color: "#000000",
          size: 4,
          outline: {
            width: 1,
            color: "#000000",
          },
        }),
      }),
    }),
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  land_cover: {
    layer: new WebTileLayer({
      id: "land_cover",
      title: "Land cover",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=landcover_cog.tif&colormap=${encodeURIComponent(JSON.stringify(LAND_COVER_COLORMAP))}`,
    }),
  },
  elevation_ranges: {
    layer: new WebTileLayer({
      id: "elevation_ranges",
      title: "Elevation ranges",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=elevation_ranges_cog.tif&colormap=${encodeURIComponent(JSON.stringify(ELEVATION_RANGES_COLORMAP))}`,
    }),
  },
  fires: {
    layer: new WebTileLayer({
      id: "fires",
      title: "Fires",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=fires_cog.tif&colormap=${encodeURIComponent(JSON.stringify(FIRES_COLORMAP))}`,
    }),
  },
  population: {
    layer: new WebTileLayer({
      id: "population",
      title: "Population",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=population_cog.tif&rescale=0,1&colormap=${encodeURIComponent(
        JSON.stringify([
          [
            [-1, 0],
            [255, 255, 255, 0],
          ],
          [
            [0, 25],
            [183, 240, 139, 0],
          ],
          [
            [25, 50],
            [82, 138, 34, 125],
          ],
          [
            [50, 75],
            [82, 138, 34, 191],
          ],
          [
            [75, 1000000000],
            [82, 138, 34, 255],
          ],
        ]),
      )}`,
    }),
  },
  deprivation_index: {
    layer: new WebTileLayer({
      id: "deprivation_index",
      title: "Deprivation index",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=deprivation_index_cog.tif&rescale=0,1&colormap=${encodeURIComponent(
        JSON.stringify([
          [
            [-1, 0],
            [255, 255, 255, 0],
          ],
          [
            [0, 25],
            [183, 240, 139, 67],
          ],
          [
            [25, 50],
            [82, 138, 34, 125],
          ],
          [
            [50, 75],
            [82, 138, 34, 191],
          ],
          [
            [75, 1000000000],
            [82, 138, 34, 255],
          ],
        ]),
      )}`,
    }),
  },
} as const;

export const DATASET_IDS = getKeys(DATASETS);

export type DatasetIds = keyof typeof DATASETS;
