import { PayloadSDK } from "@payloadcms/sdk";

import { getAbsoluteURL } from "@/lib/url";

import { Config } from "@/payload-types";

// Pass your config from generated types as generic
export const sdk = new PayloadSDK<Config>({
  baseURL: getAbsoluteURL("/api"),
});
