import type { GlobalConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";

export const SeedState: GlobalConfig = {
  slug: "seed-state",
  admin: {
    hidden: true,
  },
  access: {
    read: adminAccess,
    update: () => false,
  },
  fields: [{ name: "fingerprint", type: "text" }],
};
