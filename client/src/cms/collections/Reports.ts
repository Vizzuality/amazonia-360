import type { CollectionConfig } from "payload";

import { anyoneAccess } from "@/cms/access/anyone";
import { ownUserAccess } from "@/cms/access/owner";
import { LocationField } from "@/cms/fields/location";
import { TopicsField } from "@/cms/fields/topics";
import { beforeChangeLinkUser } from "@/cms/hooks/user";

export const Reports: CollectionConfig = {
  slug: "reports",
  admin: {
    defaultColumns: ["id", "title", "user", "_status"],
  },
  access: {
    read: anyoneAccess,
    create: anyoneAccess,
    update: ownUserAccess,
    delete: ownUserAccess,
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      maxLength: 60,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: ["users"],

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
