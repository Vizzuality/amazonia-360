import type { CollectionConfig } from "payload";

export const Accounts: CollectionConfig = {
  slug: "accounts",
  authorship: false,
  versions: false,
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
    { name: "refreshToken", type: "text" },
    { name: "accessToken", type: "text" },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
  ],
};
