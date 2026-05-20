import type { CollectionConfig } from "payload";

import { auth, signOut } from "@/lib/auth";

import { adminAccess } from "@/cms/access/admin";
import { appAccess } from "@/cms/access/app";
import { beforeDeleteAnonymousUser } from "@/cms/hooks/user";

export const AnonymousUsers: CollectionConfig = {
  slug: "anonymous-users",
  auth: {
    disableLocalStrategy: true,
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    strategies: [
      {
        name: "authjs",
        authenticate: async ({ headers, payload }) => {
          // Skip authentication for Payload admin requests so a non-admin session
          // does not get surfaced inside the admin panel.
          const currentPath = headers.get("x-current-path") ?? "";
          if (currentPath === "/admin" || currentPath.startsWith("/admin/")) {
            return { user: null };
          }

          const session = await auth();

          if (!session || !session?.user?.id) {
            return { user: null };
          }

          const user = await payload.findByID({
            collection: "anonymous-users",
            id: session.user.id,
            disableErrors: true,
          });

          return { user: user ? { ...user, collection: "anonymous-users" } : null };
        },
      },
    ],
  },
  access: {
    create: appAccess,
    read: appAccess,
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
  hooks: {
    beforeDelete: [beforeDeleteAnonymousUser],
  },
};
