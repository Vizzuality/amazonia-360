import FeatureReductionCluster from "@arcgis/core/layers/support/FeatureReductionCluster";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import Query from "@arcgis/core/rest/support/Query";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";

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
  // LAND_COVER_COLORMAP,
  POPULATION,
  PROTECTED_AREAS,
} from "@/constants/colors";

export interface FeatureLayer extends __esri.FeatureLayerProperties {
  type: "feature";
  customParameters?: Record<"position", unknown>;
}

export const DATASETS = {
  admin0: {
    layer: {
      id: "admin0",
      type: "feature",
      title: "Administrative boundaries (Adm0)",
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
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_ADM0/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  admin1: {
    layer: {
      id: "admin1",
      type: "feature",
      title: "Administrative boundaries (Adm1)",
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
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_ADM1/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  admin2: {
    layer: {
      id: "admin2",
      title: "Administrative boundaries (Adm2)",
      type: "feature",
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
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_ADM2/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  area_afp: {
    layer: {
      id: "area_afp",
      title: "Límite del área AFP",
      type: "feature",
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
    } satisfies FeatureLayer,
    legend: null,
    metadata: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  ciudades_capitales: {
    layer: {
      id: "ciudades_capitales",
      title: "Capital cities",
      type: "feature",
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
      popupTemplate: new PopupTemplate({
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
      }),
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  frontera_internacional: {
    layer: {
      id: "frontera_internacional",
      title: "Vectores frontera internacional",
      type: "feature",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/REFERENCIA_FRONTERA_INTERNACIONAL/FeatureServer/0",
    } satisfies FeatureLayer,
    legend: null,
    metadata: null,
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  tierras_indigenas: {
    title: "Indigenous lands",
    layer: {
      id: "tierras_indigenas",
      title: "Indigenous lands",
      type: "feature",
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
      popupEnabled: true,
      popupTemplate: new PopupTemplate({
        title: "{nombre}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "categoria",
                label: "Category",
              },
              {
                fieldName: "etnias",
                label: "Ethnicities",
              },
            ],
          },
        ],
      }),
    } satisfies FeatureLayer,
    legend: {
      type: "basic" as const,
      items: getKeys(INDIGENOUS_LANDS).map((k) => ({
        id: k,
        label: INDIGENOUS_LANDS[k].label,
        color: INDIGENOUS_LANDS[k].color,
      })),
    },
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Tierras_indigenas/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  tipos_climaticos: {
    layer: {
      id: "tipos_climaticos",
      title: "Climate types (Köepen)",
      type: "feature",
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
      popupEnabled: true,
      popupTemplate: new PopupTemplate({
        title: "{Field3}",
        content: [],
      }),
    } satisfies FeatureLayer,
    legend: {
      type: "basic" as const,
      items: getKeys(CLIMATE_TYPES)
        .toSorted((a, b) => CLIMATE_TYPES[a].label.localeCompare(CLIMATE_TYPES[b].label))
        .map((k) => ({
          id: k,
          label: CLIMATE_TYPES[k].label,
          color: CLIMATE_TYPES[k].color,
        })),
    },
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Tipos_climaticos_KOEPEN/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  biomas: {
    layer: {
      id: "biomas",
      title: "Biomes",
      type: "feature",
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
      popupEnabled: true,
      popupTemplate: new PopupTemplate({
        title: "{BIOMADES}",
      }),
    } satisfies FeatureLayer,
    legend: {
      type: "basic" as const,
      items: getKeys(BIOMES)
        .toSorted((a, b) => BIOMES[a].label.localeCompare(BIOMES[b].label))
        .map((k) => ({
          id: k,
          label: BIOMES[k].label,
          color: BIOMES[k].color,
        })),
    },
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Biomas/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  ecosistemas: {
    layer: {
      id: "ecosistemas",
      title: "Ecosistemas",
      type: "feature",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Ecosistemas/FeatureServer/0",
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Ecosistemas/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  cuencas_hidrograficas: {
    layer: {
      id: "cuencas_hidrograficas",
      title: "Hydrographic basins",
      type: "feature",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/0",
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Grandes_cuencas_hidrograficas/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  areas_protegidas: {
    title: "Protected areas",
    layer: {
      id: "areas_protegidas",
      title: "Protected areas",
      type: "feature",
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
      popupEnabled: true,
      popupTemplate: new PopupTemplate({
        title: "{NAME}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "DESIG_ENG",
                label: "Designation",
              },
              {
                fieldName: "IUCN_CAT",
                label: "IUCN",
              },
            ],
          },
        ],
      }),
    } satisfies FeatureLayer,
    legend: {
      type: "basic" as const,
      items: getKeys(PROTECTED_AREAS).map((k) => ({
        id: k,
        label: PROTECTED_AREAS[k].label,
        color: PROTECTED_AREAS[k].color,
      })),
    },
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Areas_protegidas/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  institutional_tracking: {
    layer: {
      id: "institutional_tracking",
      title: "Institutional Tracking",
      type: "feature",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Institutional_Tracking/FeatureServer/0",
      customParameters: {
        position: "top",
      },
      featureReduction: new FeatureReductionCluster({
        clusterMinSize: 16.5,
        labelingInfo: [
          {
            deconflictionStrategy: "none",
            labelExpressionInfo: {
              expression: "Text($feature.cluster_count, '#,###')",
            },
            symbol: new TextSymbol({
              color: "#FFFFFF",
              font: {
                size: 12,
              },
            }),
            labelPlacement: "center-center",
          } satisfies Partial<__esri.LabelClass>,
        ],
      }) satisfies Partial<__esri.FeatureReductionClusterProperties>,
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          color: "#004E70",
          size: 4,
          outline: {
            width: 1,
            color: "#004E70",
          },
        }),
      }),
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_Institutional_Tracking/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  idb_operations: {
    title: "IDB funding Operations",
    layer: {
      id: "idb_operations",
      title: "IDB Operations",
      type: "feature",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/IDB_Operations/FeatureServer/0",
      customParameters: {
        position: "top",
      },
      featureReduction: new FeatureReductionCluster({
        clusterMinSize: 16.5,
        labelingInfo: [
          {
            deconflictionStrategy: "none",
            labelExpressionInfo: {
              expression: "Text($feature.cluster_count, '#,###')",
            },
            symbol: new TextSymbol({
              color: "#FFFFFF",
              font: {
                size: "12px",
              },
            }),
            labelPlacement: "center-center",
          } satisfies Partial<__esri.LabelClass>,
        ],
      }) satisfies Partial<__esri.FeatureReductionClusterProperties>,
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
    } satisfies FeatureLayer,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/IDB_Operations/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "objectid is not null",
        outFields: ["*"],
        ...props,
      }),
  },
  land_cover: {
    layer: {
      id: "land_cover",
      type: "imagery-tile" as const,
      title: "Land cover",
      url: "https://iservices6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services/landcover_cog/ImageServer",
    },
    legend: {
      type: "basic" as const,
      items: getKeys(LAND_COVER)
        .toSorted((a, b) => LAND_COVER[a].label.localeCompare(LAND_COVER[b].label))
        .map((k) => ({
          id: k,
          label: LAND_COVER[k].label,
          color: LAND_COVER[k].color,
        })),
    },
    metadata: {
      type: "raster",
      url: null,
      data: `<p><strong>Types of land coverages in the AFP&#39;s area of work.</strong></p>
      <p>Polygon and raster image versions representing land cover in the AFP&#39;s work area.</p>
      <p>Compiled by AmazoniaForever360+ (2023-2024) , from ESA WorldCover project data, consisting of global land cover products at 10 m resolution for 2021, from Sentinel-1 and 2 data. ( <a href="https://worldcover2021.esa.int/">https://worldcover2021.esa.int/</a>)</p>
      <p>The legend includes 11 generic classes that adequately describe the land surface at 10 m: &quot;Tree cover&quot;, &quot;Shrublands&quot;, &quot;Grasslands&quot;, &quot;Croplands&quot;, &quot;Urbanized&quot;, &quot;Bare/shrubby vegetation&quot;, &quot;Snow and ice&quot;, &quot;Permanent water bodies&quot;, &quot;Herbaceous wetlands&quot;, &quot;Mangroves&quot; and &quot;Mosses and lichens&quot;. The portion of the data for northern South America was extracted, sampled and projected to generate a raster and a vector version for testing the zonal viewer assembly.</p>
      `,
    },
  },
  elevation_ranges: {
    layer: {
      id: "elevation_ranges",
      type: "web-tile" as const,
      title: "Elevation ranges",
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=elevation_ranges_cog.tif&colormap=${encodeURIComponent(JSON.stringify(ELEVATION_RANGES_COLORMAP))}`,
    },
    legend: {
      type: "basic" as const,
      items: getKeys(ELEVATION_RANGES).map((k) => ({
        id: k,
        label: ELEVATION_RANGES[k].label,
        color: ELEVATION_RANGES[k].color,
      })),
    },
    metadata: {
      type: "raster",
      url: null,
      data: `<p><strong>Altitudinal and topographic slope ranges of the terrain.</strong></p>
      <p>Layers of polygons representing the ranges of altitude above sea level in meters (AFP_ALTIT) and the topographic slope of the terrain in degrees (AFP_SLOP), for the entire in the AFP&#39;s work area.</p>
      <p>Compiled by AmazoniaForever360+, 2023, from Copernicus DEM elevation data which is a Digital Surface Model (DSM) representing the topographic surface of the Earth including buildings, infrastructure and vegetation. In particular, the GLO-30 product has been used, offering global coverage with a resolution of 30 meters. A Copernicus DEM altitude raster layer has been constructed in AmazoniaForever360+, covering northern South America. The original altitude raster data has been sampled and reclassified into classes relevant to agricultural development and forest management, infrastructure installation feasibility, accessibility and flood risk. The two vector layers of altitude and slope were then assembled from this reclassification.
      Copernicus DEM:
      <a href="https://spacedata.copernicus.eu/es/collections/copernicus-digital-elevation-model">https://spacedata.copernicus.eu/es/collections/copernicus-digital-elevation-model</a></p>`,
    },
  },
  fires: {
    layer: {
      id: "fires",
      title: "Fires",
      type: "web-tile" as const,
      urlTemplate: `${env.NEXT_PUBLIC_API_URL}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?raster_filename=fires_cog.tif&colormap=${encodeURIComponent(JSON.stringify(FIRES_COLORMAP))}`,
    },

    legend: {
      type: "basic" as const,
      items: getKeys(FIRES).map((k) => ({
        id: k,
        label: FIRES[k].label,
        color: FIRES[k].color,
      })),
    },
    metadata: {
      type: "raster",
      url: null,
      data: `<p><strong>Frequency ranges of forest fires in the AFP work area.</strong></p>
      <p>Forest fire frequency classes, based on remotely sensed hot spot and forest fire data.</p>
      <p>Compiled by AmazoniaForever360+ based on basic data of hot spots and forest fires from: Fire Information for Resource Management System (FIRMS) NASA.
      <a href="https://firms.modaps.eosdis.nasa.gov/">https://firms.modaps.eosdis.nasa.gov/</a></p>
      <p>The historical data of hot spots between March 2014 and March 2024, from the observation of different types of radiometers in Earth orbit, were requested and downloaded. The resulting event cloud was sampled using a 10 km analysis grid for each rectangular cell, covering the entire AFP working area. The centroids were generated with the accumulated events per cell and transformed into a raster image. This was reclassified to obtain event frequency ranges, cells with industrial or geological hot spots were filtered and polygons were generated to represent regions according to the frequency of fires.</p>
      `,
    },
  },
  population: {
    layer: {
      id: "population",
      title: "Global Human Settlement Layer (GHSL) - Population projection for 2025",
      type: "web-tile" as const,
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
    },
    legend: {
      type: "gradient" as const,
      items: getKeys(POPULATION).map((k, i, arr) => ({
        id: k,
        label: i === 0 || i === arr.length - 1 ? POPULATION[k].label : null,
        color: POPULATION[k].color,
      })),
    },
    metadata: {
      type: "raster",
      url: null,
      data: `<p><strong>Estimated population for the year 2025 in the AFP&#39;s work area.</strong></p>
      <p>Raster model representing the population projection for the year 2025 expressed in number of inhabitants per pixel of 180 meters resolution.</p>
      <p>Adaptation of data from the Global Human Settlement Layer (GHSL) project: Joint Research Centre (JRC), Science and Knowledge Service of the European Commission. Publications Office of the European Union, Luxembourg, 2022.
      <a href="https://ghsl.jrc.ec.europa.eu/ghs_pop.php">https://ghsl.jrc.ec.europa.eu/ghs_pop.php</a>
      Data from publication 2023A of are explained in:
      Schiavina, M., Melchiorri, M., Pesaresi, M., Politis, P., Carneiro Freire, S.M., Maffenini, L., Florio, P., Ehrlich, D., Goch, K., Carioli, A., Uhl, J., Tommasi, P. and Kemper, T., GHSL Data Package 2023, Publications Office of the European Union, Luxembourg, 2023, ISBN 978-92-68-02341-9, doi:10.2760/098587, JRC133256.</p>
      <p><a href="https://publications.jrc.ec.europa.eu/repository/handle/JRC133256">https://publications.jrc.ec.europa.eu/repository/handle/JRC133256</a>
      From the global data layer: GHS_POP_E2025_GLOBE_R2023A_4326_3ss_V1_0.tif,
      The data for northern South America were extracted, reprojected and sampled to suit the requirements of the zonal viewer. The resolution of the original model (90 m) was reduced by aggregation to a size suitable for the viewer, 180 meters.</p>
      `,
    },
  },
  deprivation_index: {
    layer: {
      id: "deprivation_index",
      title: "Deprivation index",
      type: "web-tile" as const,
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
    },
    legend: {
      type: "gradient" as const,
      items: getKeys(DEPRIVATION_INDEX).map((k, i, arr) => ({
        id: k,
        label: i === 0 || i === arr.length - 1 ? DEPRIVATION_INDEX[k].label : null,
        color: DEPRIVATION_INDEX[k].color,
      })),
    },
    metadata: {
      type: "raster",
      url: null,
      data: `<p><strong>Estimate of deprivation, deprivation in living conditions in the AFP&#39;s work area.</strong></p>
      <p>Raster model that represents the levels of multidimensional deprivation in living conditions of the population, by means of an index assigned to each pixel of one kilometer resolution.</p>
      <p>Adapted by AmazoniaForever360+, 2023, from the Global Relative Deprivation Index (GRDI), v1 (2010-2020) generated by the Socioeconomic Data and Applications Center (SEDAC; NASA, Columbia University) This is a gridded global relative deprivation index that characterizes multidimensional deprivation levels at each pixel with a resolution of ~1 km. The original GRDI dataset is a one-kilometer pixel model, with a value from 0 to 100, where a value of 100 represents the highest level of relative deprivation and a value of 0 the lowest. GRDIv1. It groups weights of six input components, or dimensions, which are combined to determine the degree of relative deprivation. These dimensions consider economic aspects and living conditions data. The original file is: povmap-grdi-v1-grdiv1-geotiff(1).zip; and comes from:
      Center for International Earth Science Information Network (CIESIN), Columbia University. 2022. Global Gridded Relative Deprivation Index (GRDI), Version 1. Palisades, New York: NASA Socioeconomic Data and Applications Center (SEDAC). <a href="https://doi.org/10.7927/3xxe-ap97">https://doi.org/10.7927/3xxe-ap97</a></p>
      `,
    },
  },
  acu_knowledge: {
    layer: {
      id: "acu_knowledge",
      title: "ACU Knowledge",
      type: "feature" as const,
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
    },
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/ACU_KnowledgeDB/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) =>
      new Query({
        where: "FID is not null",
        outFields: ["*"],
        ...props,
      }),
  },
};

export const DATASET_IDS = getKeys(DATASETS);

export type DatasetIds = keyof typeof DATASETS;

export type Dataset = (typeof DATASETS)[DatasetIds];
