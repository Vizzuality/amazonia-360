import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";

export const Accounts: CollectionConfig = {
  slug: "accounts",
  // Rows hold OAuth accessToken / refreshToken values. Without an explicit block Payload falls
  // back to defaultAccess, which grants read to any authenticated user. The NextAuth adapter and
  // the user hooks reach this collection through the Local API, which overrides access by default.
  access: {
    create: adminAccess,
    read: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  indexes: [
    {
      fields: ["provider", "providerAccountId"],
      unique: true,
    },
  ],
  fields: [
    { name: "type", type: "text", required: true },
    { name: "provider", type: "text", required: true },
    { name: "providerAccountId", type: "text", required: true },
    { name: "refreshToken", type: "text", hidden: true },
    { name: "accessToken", type: "text", hidden: true },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
  ],
};
