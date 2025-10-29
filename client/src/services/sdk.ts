import { PayloadSDK } from "@payloadcms/sdk";

import { Config } from "@/payload-types";

// Pass your config from generated types as generic
export const sdk = new PayloadSDK<Config>({
  baseURL: `${process.env.NEXT_PUBLIC_URL}/api`,
});
