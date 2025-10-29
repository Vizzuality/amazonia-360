// storage-adapter-import-placeholder
import path from "path";
import { fileURLToPath } from "url";

import { buildConfig } from "payload";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import sharp from "sharp";

import { env } from "@/env.mjs";

import { Media } from "@/cms/collections/Media";
import { Reports } from "@/cms/collections/Reports";
import { Users } from "@/cms/collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  graphQL: {
    disable: true,
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Reports],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: env.NEXT_PUBLIC_URL,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
});
