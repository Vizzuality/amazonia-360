"use client";
import { PropsWithChildren, useMemo } from "react";

import esriConfig from "@arcgis/core/config";

import { env } from "@/env.mjs";

import { useSession } from "@/lib/session";

export const ArcGISProvider = ({
  children,
  session,
}: PropsWithChildren<{
  session: {
    token?: string;
    expires_in: number;
  };
}>) => {
  const { data: sessionData } = useSession({
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 5 * 60 * 1000,
    initialData: {
      token: session?.token,
      expires_in: session?.expires_in,
    },
  });

  useMemo(() => {
    esriConfig.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;

    esriConfig.request.interceptors?.push({
      urls: [env.NEXT_PUBLIC_API_URL],
      headers: {
        Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
      },
    });

    // Add token to the request interceptor
    const i = esriConfig.request.interceptors?.find((i) => {
      if (Array.isArray(i.urls)) {
        return i.urls.includes("https://atlas.iadb.org");
      }
    });

    if (i) {
      i.query = {
        token: sessionData?.token,
      };
    }

    if (!i) {
      esriConfig.request.interceptors?.push({
        urls: ["https://atlas.iadb.org"],
        query: {
          token: sessionData?.token,
        },
      });
    }
  }, [sessionData]);

  return children;
};
