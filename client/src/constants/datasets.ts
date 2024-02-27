import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Query from "@arcgis/core/rest/support/Query";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

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

    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: new Polygon({
        hasZ: false,
        rings: [
          [
            [-67.31103404787922, -11.661233160198478],
            [-66.30420141042109, -14.55282988542723],
            [-65.74704984520523, -11.6657021602758],
            [-64.73063426395457, -13.636933141719169],
            [-64.21144625073742, -10.57328110561042],
            [-62.66147776498329, -13.060157745373786],
            [-61.90003054919214, -10.015509154938869],
            [-62.64525455392423, -8.046035000161865],
            [-64.80917311077667, -7.911512505979346],
            [-67.1534448198541, -8.655921487346376],
            [-67.31103404787922, -11.661233160198478],
          ],
        ],
      }),
    }),
  },
  area_afp: {
    layer: new FeatureLayer({
      id: "area_afp",
      title: "Límite del área AFP",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_AREA_DE_TRABAJO_PANAMAZONIA/FeatureServer/0",
    }),
    getFeatures: undefined,
  },
  ciudades_capitales: {
    layer: new FeatureLayer({
      id: "ciudades_capitales",
      title: "Ciudades capitales",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/0",
    }),
    getFeatures: undefined,
  },
  frontera_internacional: {
    layer: new FeatureLayer({
      id: "frontera_internacional",
      title: "Vectores frontera internacional",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/REFERENCIA_FRONTERA_INTERNACIONAL/FeatureServer/0",
    }),
    getFeatures: undefined,
  },
  tierras_indigenas: {
    layer: new FeatureLayer({
      id: "tierras_indigenas",
      title: "Tierras indígenas",
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
    getFeatures: undefined,
  },
  tipos_climaticos: {
    layer: new FeatureLayer({
      id: "tipos_climaticos",
      title: "Tipos climáticos (Koepen)",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0",
    }),
    getFeatures: undefined,
  },
  biomas: {
    layer: new FeatureLayer({
      id: "biomas",
      title: "Biomas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0",
    }),
    getFeatures: undefined,
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
    getFeatures: undefined,
  },
  cuencas_hidrograficas: {
    layer: new FeatureLayer({
      id: "cuencas_hidrograficas",
      title: "Cuenca hidrográfica, pertenencia a grandes cuencas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0",
    }),
    getFeatures: undefined,
  },
  areas_protegidas: {
    layer: new FeatureLayer({
      id: "areas_protegidas",
      title: "Áreas protegidas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0",
    }),
    getFeatures: undefined,
  },
} as const;

export type DatasetIds = keyof typeof DATASETS;
