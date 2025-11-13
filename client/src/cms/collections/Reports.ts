import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { ownPolymorphicAnonymousUser, ownPolymorphicUser } from "@/cms/access/owner";
import { LocationField } from "@/cms/fields/location";
import { TopicsField } from "@/cms/fields/topics";
import { or } from "@/cms/utils/or";

export const Reports: CollectionConfig = {
  slug: "reports",
  access: {
    read: anyoneAccess,
    create: anyoneAccess,
    update: or(ownPolymorphicAnonymousUser, ownPolymorphicUser),
    delete: or(adminAccess, ownPolymorphicUser),
  },
  fields: [
    {
      name: "title",
      type: "text",
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "user",
      type: "relationship",
      relationTo: ["users", "anonymous-users"],
      admin: {
        readOnly: true,
      },
    },

    LocationField,
    TopicsField,
  ],
  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation !== "create") {
          return data;
        }

        data ||= {};
        if (data.user) {
          return data;
        }

        if (req.user?.id) {
          if (req.user.collection === "anonymous-users") {
            data.user = { relationTo: req.user.collection, value: req.user.apiKey };
          }

          data.user = { relationTo: req.user.collection, value: req.user.id };
          return data;
        }

        return data;
      },
    ],
  },
};
