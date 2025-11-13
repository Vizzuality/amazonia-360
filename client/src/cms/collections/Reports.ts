import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { ownPolymorphicAnonymousUser, ownPolymorphicUser } from "@/cms/access/owner";
import { LocationField } from "@/cms/fields/location";
import { TopicsField } from "@/cms/fields/topics";
import { linkUserHook } from "@/cms/hooks/link-user";
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
    beforeChange: [linkUserHook],
  },
};
