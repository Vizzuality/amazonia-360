import Polygon from "@arcgis/core/geometry/Polygon";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Query from "@arcgis/core/rest/support/Query";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

import GEOJSON from "@/data/geojson.json";

export const GEOMETRY_TEST = new Polygon({
  hasZ: false,
  rings: GEOJSON.features[0].geometry.coordinates,
});

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
      geometry: GEOMETRY_TEST,
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
    getFeatures: undefined,
  },
  ciudades_capitales: {
    layer: new FeatureLayer({
      id: "ciudades_capitales",
      title: "Ciudades capitales",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/0",
    }),
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
    }),
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
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
    }),
  },
  tipos_climaticos: {
    layer: new FeatureLayer({
      id: "tipos_climaticos",
      title: "Tipos climáticos (Koepen)",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0",
    }),
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
    }),
  },
  biomas: {
    layer: new FeatureLayer({
      id: "biomas",
      title: "Biomas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0",
    }),
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
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
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
    }),
  },
  cuencas_hidrograficas: {
    layer: new FeatureLayer({
      id: "cuencas_hidrograficas",
      title: "Cuenca hidrográfica, pertenencia a grandes cuencas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0",
    }),
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
    }),
  },
  areas_protegidas: {
    layer: new FeatureLayer({
      id: "areas_protegidas",
      title: "Áreas protegidas",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Areas_protegidas/FeatureServer/0",
    }),
    getFeatures: new Query({
      where: "FID is not null",
      outFields: ["*"],
      returnGeometry: false,
      geometry: GEOMETRY_TEST,
    }),
  },
} as const;

export type DatasetIds = keyof typeof DATASETS;
