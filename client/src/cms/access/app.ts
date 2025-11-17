import type { Access } from "payload";

import { env } from "@/env.mjs";
export const appAccess: Access = ({ req }) => {
  const appKey = req.headers.get("x-app-key");
  if (appKey && appKey === env.APP_KEY) {
    return true;
  }
  return false;
};
