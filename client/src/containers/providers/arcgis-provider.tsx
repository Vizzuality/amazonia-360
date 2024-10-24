import { PropsWithChildren, useMemo } from "react";

import esriConfig from "@arcgis/core/config";

import { env } from "@/env.mjs";

import { useSession } from "@/lib/session";

export const ArcGISProvider = ({
  children,
  session,
}: PropsWithChildren<{
  session: {
    token: string | undefined;
    expire: number;
  };
}>) => {
  useSession({
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  useMemo(() => {
    console.log(session);
    // esriConfig.apiKey = arcgisAccessToken || env.NEXT_PUBLIC_ARCGIS_API_KEY;
    esriConfig.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;
    esriConfig.request.interceptors?.push({
      urls: [env.NEXT_PUBLIC_API_URL],
      headers: {
        Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
      },
    });
  }, [session]);

  return children;
};
