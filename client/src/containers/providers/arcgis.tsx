"use client";
import { PropsWithChildren, useMemo } from "react";

import esriConfig from "@arcgis/core/config";

import { env } from "@/env.mjs";

import { DATASETS } from "@/constants/datasets";

export const ArcGISProvider = ({ children }: PropsWithChildren) => {
  useMemo(() => {
    esriConfig.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;

    esriConfig.request.interceptors?.push({
      urls: [`/custom-api`],
    });

    esriConfig.request.interceptors?.push({
      urls: [
        DATASETS.admin0.layer.url,
        DATASETS.admin1.layer.url,
        DATASETS.admin2.layer.url,
        DATASETS.ciudades_capitales.layer.url,
      ],
      query: {
        collation: JSON.stringify({ accentSensitive: false, caseSensitive: false }),
      },
    });
  }, []);

  return children;
};
