"use client";
import { PropsWithChildren, useMemo } from "react";

import esriConfig from "@arcgis/core/config";

import { env } from "@/env.mjs";

export const ArcGISProvider = ({ children }: PropsWithChildren) => {
  useMemo(() => {
    esriConfig.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;

    esriConfig.request.interceptors?.push({
      urls: [env.NEXT_PUBLIC_API_URL],
      headers: {
        Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
      },
    });
  }, []);

  return children;
};
