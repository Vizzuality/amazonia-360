import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { userAccess } from "@/cms/access/user";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  access: {
    create: anyoneAccess,
    read: userAccess,
    update: userAccess,
    delete: adminAccess,
  },
  fields: [
    { name: "name", type: "text" },
    { name: "image", type: "text" },
    { name: "emailVerified", type: "date" },
    {
      name: "accounts",
      type: "join",
      collection: "accounts",
      on: "user",
    },
  ],
};
