import { PayloadSDK } from "@payloadcms/sdk";

import { getAbsoluteURL } from "@/lib/url";

import { Config } from "@/payload-types";

const payloadBaseURL = getAbsoluteURL("/api");
console.log("Payload Base URL:", payloadBaseURL);

// Pass your config from generated types as generic
export const sdk = new PayloadSDK<Config>({
  baseURL: payloadBaseURL,
  baseInit: {
    credentials: "include",
  },
});
