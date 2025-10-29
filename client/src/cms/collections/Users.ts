import type { CollectionConfig } from "payload";

import { adminAccess, fieldAdminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { userAccess } from "@/cms/access/user";
import { protectRole } from "@/cms/hooks/auth";

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
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "user",
      options: [
        {
          label: "Admin",
          value: "admin",
        },
        {
          label: "User",
          value: "user",
        },
      ],
      access: {
        update: fieldAdminAccess,
      },
      hooks: {
        beforeChange: [protectRole],
      },
    },
  ],
};
