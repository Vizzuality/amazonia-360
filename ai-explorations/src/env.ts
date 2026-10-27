import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function getProcessEnv(): Record<string, string | undefined> {
  return typeof process === "undefined" ? {} : process.env;
}

const runtimeEnv = { ...getProcessEnv(), ...import.meta.env };

export const env = createEnv({
  // Unit tests import modules that reach the Payload SDK, which reads this at module scope.
  skipValidation: !!runtimeEnv.SKIP_ENV_VALIDATION,
  clientPrefix: "VITE_",
  server: {
    BASIC_AUTH_ENABLED: z.string().transform((value) => value === "true"),
    BASIC_AUTH_USER: z.string(),
    BASIC_AUTH_PASSWORD: z.string(),
    PAYLOAD_SECRET: z.string(),
    DATABASE_URL: z.url(),
    DATABASE_PASSWORD: z.string().optional(),
    AWS_SES_IAM_USER_ACCESS_KEY_ID: z.string(),
    AWS_SES_IAM_USER_SECRET_ACCESS_KEY: z.string(),
    AWS_SES_REGION: z.string(),
  },
  client: {
    VITE_URL: z.url(),
    VITE_API_URL: z.url(),
    VITE_API_KEY: z.string(),
    VITE_ARCGIS_API_KEY: z.string(),
    VITE_GTM_ID: z.string().optional(),
  },
  runtimeEnv,
});
