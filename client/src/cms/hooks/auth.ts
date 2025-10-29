import { FieldHook } from "payload";

import type { User } from "@/payload-types";

export const protectRole: FieldHook<{ id: string } & User> = ({ req, data }) => {
  if (req.user?.role === "admin") {
    if (data?.id === req.user.id) {
      return "admin";
    }
    return data?.role;
  }

  return "user";
};
