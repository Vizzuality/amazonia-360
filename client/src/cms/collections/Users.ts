import type { CollectionConfig } from "payload";

import { auth, signOut } from "@/lib/auth";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { userAccess } from "@/cms/access/user";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    strategies: [
      {
        name: "authjs",
        authenticate: async ({ payload }) => {
          const session = await auth();
          console.log({ session });

          if (!session || !session?.user?.id) {
            return { user: null };
          }

          const user = await payload.findByID({
            collection: "users",
            id: Number(session.user.id),
            disableErrors: true,
          });

          return { user: user ? { ...user, collection: "users" } : null };
        },
      },
    ],
  },
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
  endpoints: [
    {
      path: "/logout",
      method: "post",
      handler: async () => {
        await signOut();
        return Response.json({
          message: "You have been logged out successfully.",
        });
      },
    },
  ],
};
