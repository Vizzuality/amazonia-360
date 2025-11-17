import type { CollectionConfig } from "payload";

import { auth, signOut } from "@/lib/auth";

import { adminAccess } from "@/cms/access/admin";
import { appAccess } from "@/cms/access/app";

export const AnonymousUsers: CollectionConfig = {
  slug: "anonymous-users",
  auth: {
    useAPIKey: true,
    disableLocalStrategy: true,
    tokenExpiration: 60 * 60 * 24 * 180, // 180 days
    strategies: [
      {
        name: "authjs",
        authenticate: async ({ payload }) => {
          const session = await auth();

          if (!session || !session?.user?.id) {
            return { user: null };
          }

          const user = await payload.findByID({
            collection: "anonymous-users",
            id: Number(session.user.id),
            disableErrors: true,
          });

          return { user: user ? { ...user, collection: "anonymous-users" } : null };
        },
      },
    ],
  },
  access: {
    read: adminAccess,
    create: appAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [],
  endpoints: [
    {
      path: "/logout",
      method: "post",
      handler: async () => {
        await signOut({
          redirect: false,
        });
        return Response.json({
          message: "You have been logged out successfully.",
        });
      },
    },
  ],
};
