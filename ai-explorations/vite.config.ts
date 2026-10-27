import path from "node:path";
import { fileURLToPath } from "node:url";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { withPayload } from "@payloadcms/tanstack-start";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async (env) => {
  Object.assign(process.env, loadEnv(env.mode, __dirname, ""));
  await import("./src/env");

  return withPayload(
    ({ pluginOptions }) => ({
      plugins: [
        tailwindcss(),
        rsc(pluginOptions.rsc),
        tanstackStart(pluginOptions.tanstackStart),
        viteReact(pluginOptions.react),
      ],
      resolve: {
        alias: {
          "@/": `${path.resolve(__dirname, "src")}/`,
        },
      },
      server: {
        port: 3100,
        strictPort: true,
        warmup: {
          clientFiles: [
            "./src/app/__root.tsx",
            "./src/app/_payload.tsx",
            "./src/app/_payload/admin.index.tsx",
            "./src/app/_payload/admin.$.tsx",
          ],
        },
      },
    }),
    {
      devServerExternalPackages: ["h3-js", "jszip"],
      payloadConfigPath: path.resolve(__dirname, "src", "payload.config.ts"),
    },
  )(env);
});
