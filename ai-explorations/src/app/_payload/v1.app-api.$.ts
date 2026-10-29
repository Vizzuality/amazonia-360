import { createFileRoute } from "@tanstack/react-router";

import { payloadApiHandlers } from "@payloadcms/tanstack-start/routes";

import { getAppApiHandlers } from "@/lib/auth/app-api";

export const Route = createFileRoute("/_payload/v1/app-api/$")({
  server: {
    handlers: getAppApiHandlers(
      async () => (await import("@payload-config")).default,
      payloadApiHandlers,
    ),
  },
});
