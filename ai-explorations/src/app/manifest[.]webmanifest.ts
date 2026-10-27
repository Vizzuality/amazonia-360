import { createFileRoute } from "@tanstack/react-router";

const MANIFEST = {
  name: "Amazonia360Forever+",
  short_name: "Amazonia360Forever+",
  description: "Amazonia360Forever+",
  start_url: "/",
  display: "standalone",
  background_color: "#fff",
  theme_color: "#fff",
  icons: [
    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
  ],
};

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(MANIFEST), {
          headers: { "content-type": "application/manifest+json" },
        }),
    },
  },
});
