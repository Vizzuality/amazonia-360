/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import { createFileRoute } from "@tanstack/react-router";

import { payloadApiHandlers } from "@payloadcms/tanstack-start/routes";

export const Route = createFileRoute("/_payload/v1/api/$")({
  server: {
    handlers: payloadApiHandlers({
      getConfig: async () => (await import("@payload-config")).default,
    }),
  },
});
