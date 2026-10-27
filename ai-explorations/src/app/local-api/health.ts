import { createFileRoute } from "@tanstack/react-router";

import { env } from "@/env";

const HEADERS = { "Cache-Control": "max-age=5, must-revalidate" };

export const Route = createFileRoute("/local-api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(env.VITE_API_URL + "/health", {
            cache: "no-cache",
          });
          if (res.status === 200) {
            return new Response("OK", { status: 200, headers: HEADERS });
          } else {
            return new Response("KO", { status: 503, headers: HEADERS });
          }
        } catch (error) {
          return new Response("KO", {
            status: 503,
            headers: HEADERS,
            statusText: (error as Error).message,
          });
        }
      },
    },
  },
});
