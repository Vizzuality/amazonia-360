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
    // Email added by default
    // Add more fields as needed
  ],
};
