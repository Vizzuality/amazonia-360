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
    expires_in: number;
  };
}>) => {
  useSession({
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
  });

  useMemo(() => {
    // esriConfig.apiKey = session.token ?? "";
    esriConfig.apiKey = env.NEXT_PUBLIC_ARCGIS_API_KEY;
    esriConfig.request.interceptors?.push({
      urls: [env.NEXT_PUBLIC_API_URL],
      headers: {
        Authorization: `Bearer ${env.NEXT_PUBLIC_API_KEY}`,
      },
    });
    esriConfig.request.interceptors?.push({
      urls: ["https://atlas.iadb.org"],
      query: {
        token: session.token,
      },
    });
  }, [session]);

  return children;
};
