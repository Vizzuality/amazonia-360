// storage-adapter-import-placeholder
import path from "path";
import { fileURLToPath } from "url";

import { buildConfig } from "payload";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import sharp from "sharp";

import { Accounts } from "@/cms/collections/Accounts";
import { Admins } from "@/cms/collections/Admins";
import { AnonymousUsers } from "@/cms/collections/AnonymousUsers";
import { Media } from "@/cms/collections/Media";
import { Reports } from "@/cms/collections/Reports";
import { Users } from "@/cms/collections/Users";
import { routing } from "@/i18n/routing";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Admins, Users, AnonymousUsers, Accounts, Media, Reports],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  editor: lexicalEditor(),
  graphQL: {
    disable: true,
  },
  localization: {
    locales: [...routing.locales], // required
    defaultLocale: routing.defaultLocale, // required
  },
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
});
