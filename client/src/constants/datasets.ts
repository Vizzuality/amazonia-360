"use client";

import { getKeys } from "@/lib/utils";

import { LayerProps } from "@/components/map/layers/types";

export const DATASETS = {
  admin0: {
    layer: {
      id: "admin0",
      type: "feature",
      title: "Administrative boundaries (Adm0)",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_0/FeatureServer/2",
    } satisfies LayerProps,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_0/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) => ({
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
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_1/FeatureServer/4",
    } satisfies LayerProps,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_1/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) => ({
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
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_2/FeatureServer/6",
    } satisfies LayerProps,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/Political_administrative_division_of_order_2/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) => ({
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
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [0, 0, 0, 0],
          style: "solid",
          outline: {
            width: 1,
            color: "#004E70",
          },
        },
      },
    } satisfies LayerProps,
    legend: null,
    metadata: null,
    getFeatures: (props?: __esri.QueryProperties) => ({
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
    } satisfies LayerProps,
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/AFP_CAPITALES_ADMIN/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) => ({
      where: "FID is not null",
      outFields: ["*"],
      ...props,
    }),
  },
  acu_knowledge: {
    layer: {
      id: "acu_knowledge",
      title: "ACU Knowledge",
      type: "feature" as const,
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/ACU_KnowledgeDB/FeatureServer/0",
    },
    legend: null,
    metadata: {
      type: "arcgis",
      url: "https://services6.arcgis.com/sROlVM0rATIYgC6a/ArcGIS/rest/services/ACU_KnowledgeDB/FeatureServer/info/metadata",
      data: null,
    },
    getFeatures: (props?: __esri.QueryProperties) => ({
      where: "FID is not null",
      outFields: ["*"],
      ...props,
    }),
  },
};

export const DATASET_IDS = getKeys(DATASETS);

export type DatasetIds = keyof typeof DATASETS;

export type Dataset = (typeof DATASETS)[DatasetIds];
