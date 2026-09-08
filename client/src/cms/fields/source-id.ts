import type { Field } from "payload";

export const sourceIdField: Field = {
  name: "id",
  type: "text",
  required: true,
  access: { update: () => false },
  admin: {
    readOnly: true,
    description:
      "Custom ID in order to match the original datum JSON. Referenced by existing reports and code. Cannot be changed.",
  },
};
