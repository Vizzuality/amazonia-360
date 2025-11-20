import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";
import { ownUserAccess } from "@/cms/access/owner";
import { userAccess } from "@/cms/access/user";
import { LocationField } from "@/cms/fields/location";
import { TopicsField } from "@/cms/fields/topics";
import { beforeChangeLinkUser } from "@/cms/hooks/user";
import { or } from "@/cms/utils/or";

export const Reports: CollectionConfig = {
  slug: "reports",
  admin: {
    defaultColumns: ["id", "title", "user", "_status"],
  },
  access: {
    read: anyoneAccess,
    create: anyoneAccess,
    update: ownUserAccess,
    delete: or(userAccess, adminAccess),
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
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
    beforeChange: [beforeChangeLinkUser],
  },
  versions: {
    drafts: true,
  },
};
