import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BASIC_AUTH_ENABLED: z.string().transform((value) => value === "true"),
    BASIC_AUTH_USER: z.string(),
    BASIC_AUTH_PASSWORD: z.string(),
    PAYLOAD_SECRET: z.string(),
    DATABASE_URL: z.url(),
    APP_KEY: z.string(),
    AUTH_SECRET: z.string(),
    AWS_SES_IAM_USER_ACCESS_KEY_ID: z.string(),
    AWS_SES_IAM_USER_SECRET_ACCESS_KEY: z.string(),
    AWS_SES_REGION: z.string(),
  },
  client: {
    NEXT_PUBLIC_WEBSHOT_URL: z.url(),
    NEXT_PUBLIC_URL: z
      .url()
      .optional()
      .transform((val) => {
        if (process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL) {
          return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`;
        }
        return val;
      })
      .pipe(z.url()),
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_API_KEY: z.string(),
    NEXT_PUBLIC_ARCGIS_API_KEY: z.string(),
  },
  runtimeEnv: {
    BASIC_AUTH_ENABLED: process.env.BASIC_AUTH_ENABLED,
    BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
    BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
    NEXT_PUBLIC_WEBSHOT_URL: process.env.NEXT_PUBLIC_WEBSHOT_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_ARCGIS_API_KEY: process.env.NEXT_PUBLIC_ARCGIS_API_KEY,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    APP_KEY: process.env.APP_KEY,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AWS_SES_IAM_USER_ACCESS_KEY_ID: process.env.AWS_SES_IAM_USER_ACCESS_KEY_ID,
    AWS_SES_IAM_USER_SECRET_ACCESS_KEY: process.env.AWS_SES_IAM_USER_SECRET_ACCESS_KEY,
    AWS_SES_REGION: process.env.AWS_SES_REGION,
  },
});
