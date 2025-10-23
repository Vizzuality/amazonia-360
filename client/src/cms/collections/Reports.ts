import type { CollectionConfig } from "payload";

import { LocationField } from "@/cms/fields/location";
import { TopicsField } from "@/cms/fields/topics";

export const Reports: CollectionConfig = {
  slug: "reports",
  fields: [
    {
      name: "title",
      type: "text",
    },
    {
      name: "description",
      type: "richText",
    },

    LocationField,
    TopicsField,
  ],
};
