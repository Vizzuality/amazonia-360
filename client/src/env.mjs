import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BASIC_AUTH_USER: z.string(),
    BASIC_AUTH_PASSWORD: z.string(),
    ARCGIS_CLIENT_ID: z.string(),
    ARCGIS_CLIENT_SECRET: z.string(),
  },
  client: {
    NEXT_PUBLIC_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_API_KEY: z.string(),
    NEXT_PUBLIC_ARCGIS_API_KEY: z.string(),
  },
  runtimeEnv: {
    ARCGIS_CLIENT_ID: process.env.ARCGIS_CLIENT_ID,
    ARCGIS_CLIENT_SECRET: process.env.ARCGIS_CLIENT_SECRET,
    BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
    BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_ARCGIS_API_KEY: process.env.NEXT_PUBLIC_ARCGIS_API_KEY,
  },
});
