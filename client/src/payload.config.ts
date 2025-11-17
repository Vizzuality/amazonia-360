// storage-adapter-import-placeholder
import path from "path";
import { fileURLToPath } from "url";

import { buildConfig } from "payload";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";
import sharp from "sharp";

import { env } from "@/env.mjs";

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
      connectionString: env.DATABASE_URL || "",
    },
    migrationDir: path.resolve(dirname, "cms", "migrations"),
  }),
  editor: lexicalEditor(),
  email: nodemailerAdapter({
    transport: nodemailer.createTransport({
      SES: {
        sesClient: new SESv2Client({
          region: env.AWS_SES_REGION,
          credentials: {
            accessKeyId: env.AWS_SES_IAM_USER_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SES_IAM_USER_SECRET_ACCESS_KEY,
          },
        }),
        SendEmailCommand,
      },
    }),
    defaultFromAddress: "info@amazoniaforever360.org",
    defaultFromName: "Amazonia Forever 360",
  }),
  graphQL: {
    disable: true,
  },
  localization: {
    locales: [...routing.locales], // required
    defaultLocale: routing.defaultLocale, // required
  },
  secret: env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
});
