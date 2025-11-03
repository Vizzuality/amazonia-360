import { PayloadSDK } from "@payloadcms/sdk";

import { env } from "@/env.mjs";

import { Config } from "@/payload-types";

// Pass your config from generated types as generic
export const sdk = new PayloadSDK<Config>({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/api`,
  baseInit: {
    credentials: "include",
  },
});
