import { PayloadSDK } from "@payloadcms/sdk";

import { env } from "@/env.mjs";

import { Config } from "@/payload-types";

// Pass your config from generated types as generic
export const sdk = new PayloadSDK<Config>({
  baseURL: `${env.NEXT_PUBLIC_URL}/api`,
  baseInit: {
    credentials: "include",
  },
  fetch: async (url, init) => {
    const response = await fetch(url, init);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fetch error: ${response.status} - ${errorText}`);
    }
    return response;
  },
});
