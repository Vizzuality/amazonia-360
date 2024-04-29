import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Query from "@arcgis/core/rest/support/Query";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";

import { env } from "@/env.mjs";

import { convertHexToRgbaArray, getKeys } from "@/lib/utils";

import {
  BIOMES,
  CLIMATE_TYPES,
  DEPRIVATION_INDEX,
  ELEVATION_RANGES,
  ELEVATION_RANGES_COLORMAP,
  FIRES,
  FIRES_COLORMAP,
  INDIGENOUS_LANDS,
  LAND_COVER,
  LAND_COVER_COLORMAP,
  POPULATION,
  PROTECTED_AREAS,
} from "@/constants/colors";

export const DATASETS = {
  admin0: {
    layer: new FeatureLayer({
      id: "admin0",
      title: "Admin0",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_ADM0/FeatureServer/0",
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
    legend: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  admin1: {
    layer: new FeatureLayer({
      id: "admin1",
      title: "Admin1",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_ADM1/FeatureServer/0",
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
    legend: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  admin2: {
    layer: new FeatureLayer({
      id: "admin2",
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
    legend: null,
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
    legend: null,
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
      popupEnabled: true,
      popupTemplate: {
        title: "{NOMBCAP}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "NAME_2",
                label: "Municipality",
              },
              {
                fieldName: "NAME_1",
                label: "State",
              },
              {
                fieldName: "NAME_0",
                label: "Country",
              },
            ],
          },
        ],
      },
    }),
    legend: null,
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
    legend: null,
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
    legend: {
      type: "basic",
      items: getKeys(INDIGENOUS_LANDS).map((k) => ({
        id: k,
        label: INDIGENOUS_LANDS[k].label,
        color: INDIGENOUS_LANDS[k].color,
      })),
    },
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
      title: "Climate types (Koepen)",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/0",
      renderer: new UniqueValueRenderer({
        field: "Field2",
        defaultSymbol: new SimpleFillSymbol({
          color: [227, 139, 79, 0.8],
          outline: {
            color: [230, 230, 230, 0.8],
            width: 1,
          },
        }),
        uniqueValueInfos: getKeys(CLIMATE_TYPES).map((k) => ({
          value: k,
          symbol: new SimpleFillSymbol({
            color: CLIMATE_TYPES[k].color,
            outline: {
              color: [0, 0, 0, 0.25],
              width: 0.5,
            },
          }),
        })),
      }),
    }),
    legend: {
      type: "basic",
      items: getKeys(CLIMATE_TYPES)
        .toSorted((a, b) =>
          CLIMATE_TYPES[a].label.localeCompare(CLIMATE_TYPES[b].label),
        )
        .map((k) => ({
          id: k,
          label: CLIMATE_TYPES[k].label,
          color: CLIMATE_TYPES[k].color,
        })),
    },
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
      title: "Biomes",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Biomas/FeatureServer/0",
      maxScale: 0,
      renderer: new UniqueValueRenderer({
        field: "BIOME",
        defaultSymbol: new SimpleFillSymbol({
          color: [227, 139, 79, 0.8],
          outline: {
            color: [230, 230, 230, 0.8],
            width: 1,
          },
        }),
        uniqueValueInfos: getKeys(BIOMES).map((k) => ({
          value: k,
          symbol: new SimpleFillSymbol({
            color: BIOMES[k].color,
            outline: {
              color: [0, 0, 0, 0.25],
              width: 0.5,
            },
          }),
        })),
      }),
    }),
    legend: {
      type: "basic",
      items: getKeys(BIOMES)
        .toSorted((a, b) => BIOMES[a].label.localeCompare(BIOMES[b].label))
        .map((k) => ({
          id: k,
          label: BIOMES[k].label,
          color: BIOMES[k].color,
        })),
    },
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
    }),
    legend: null,
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
    legend: null,
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
    legend: {
      type: "basic",
      items: getKeys(PROTECTED_AREAS).map((k) => ({
        id: k,
        label: PROTECTED_AREAS[k].label,
        color: PROTECTED_AREAS[k].color,
      })),
    },
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
    legend: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  idb_operations: {
    layer: new FeatureLayer({
      id: "idb_operations",
      title: "IDB Operations",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/IDB_Operations/FeatureServer/0",
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
    legend: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "objectid is not null",
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
    legend: {
      type: "basic",
      items: getKeys(LAND_COVER)
        .toSorted((a, b) =>
          LAND_COVER[a].label.localeCompare(LAND_COVER[b].label),
        )
        .map((k) => ({
          id: k,
          label: LAND_COVER[k].label,
          color: LAND_COVER[k].color,
        })),
    },
  },
  elevation_ranges: {
    layer: new WebTileLayer({
      id: "elevation_ranges",
      title: "Elevation ranges",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=elevation_ranges_cog.tif&colormap=${encodeURIComponent(JSON.stringify(ELEVATION_RANGES_COLORMAP))}`,
    }),
    legend: {
      type: "basic",
      items: getKeys(ELEVATION_RANGES).map((k) => ({
        id: k,
        label: ELEVATION_RANGES[k].label,
        color: ELEVATION_RANGES[k].color,
      })),
    },
  },
  fires: {
    layer: new WebTileLayer({
      id: "fires",
      title: "Fires",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=fires_cog.tif&colormap=${encodeURIComponent(JSON.stringify(FIRES_COLORMAP))}`,
    }),

    legend: {
      type: "basic",
      items: getKeys(FIRES).map((k) => ({
        id: k,
        label: FIRES[k].label,
        color: FIRES[k].color,
      })),
    },
  },
  population: {
    layer: new WebTileLayer({
      id: "population",
      title: "Population",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=population_cog.tif&colormap=${encodeURIComponent(
        JSON.stringify([
          [
            [-1, 1],
            [255, 255, 255, 0],
          ],
          ...getKeys(POPULATION).map((k) => [
            [POPULATION[k].min, POPULATION[k].max],
            convertHexToRgbaArray(POPULATION[k].color),
          ]),
        ]),
      )}`,
    }),
    legend: {
      type: "gradient",
      items: getKeys(POPULATION).map((k, i, arr) => ({
        id: k,
        label: i === 0 || i === arr.length - 1 ? POPULATION[k].label : null,
        color: POPULATION[k].color,
      })),
    },
  },
  deprivation_index: {
    layer: new WebTileLayer({
      id: "deprivation_index",
      title: "Deprivation index",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=deprivation_index_cog.tif&colormap=${encodeURIComponent(
        JSON.stringify([
          [
            [-1, 0],
            [255, 255, 255, 0],
          ],
          ...getKeys(DEPRIVATION_INDEX).map((k) => [
            [DEPRIVATION_INDEX[k].min, DEPRIVATION_INDEX[k].max],
            convertHexToRgbaArray(DEPRIVATION_INDEX[k].color),
          ]),
        ]),
      )}`,
    }),
    legend: {
      type: "gradient",
      items: getKeys(DEPRIVATION_INDEX).map((k, i, arr) => ({
        id: k,
        label:
          i === 0 || i === arr.length - 1 ? DEPRIVATION_INDEX[k].label : null,
        color: DEPRIVATION_INDEX[k].color,
      })),
    },
  },
  acu_knowledge: {
    layer: new FeatureLayer({
      id: "acu_knowledge",
      title: "ACU Knowledge",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/ACU_KnowledgeDB/FeatureServer/0",
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
    legend: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
} as const;

export const DATASET_IDS = getKeys(DATASETS);

export type DatasetIds = keyof typeof DATASETS;
