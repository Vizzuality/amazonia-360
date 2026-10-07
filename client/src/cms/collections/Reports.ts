import type { CollectionConfig } from "payload";

import { authenticatedAccess } from "@/cms/access/authenticated";
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
    read: authenticatedAccess,
    create: authenticatedAccess,
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
    // Deprecated by `modules`; kept so no environment loses data before the backfill seed has run there.
    {
      name: "country",
      type: "select",
      hasMany: true,
      options: ["ECU", "BOL", "BRA", "COL", "GUY", "PER", "SUR", "VEN"],
      admin: { hidden: true },
    },
    {
      name: "modules",
      type: "relationship",
      relationTo: "country-modules",
      hasMany: true,
      admin: {
        readOnly: true,
        description:
          "The country modules active when this report was created. Empty is the Amazon Region — reports created before country modules existed.",
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
