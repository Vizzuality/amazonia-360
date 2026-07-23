import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { appAccess } from "@/cms/access/app";
import { createAuthjsStrategy, logoutEndpoint } from "@/cms/auth/authjs-strategy";
import { beforeDeleteAnonymousUser } from "@/cms/hooks/user";

export const AnonymousUsers: CollectionConfig = {
  slug: "anonymous-users",
  auth: {
    disableLocalStrategy: true,
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    strategies: [createAuthjsStrategy("anonymous-users")],
  },
  access: {
    create: appAccess,
    read: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [],
  endpoints: [logoutEndpoint],
  hooks: {
    beforeDelete: [beforeDeleteAnonymousUser],
  },
};
