import type { Access } from "payload";
export const appAccess: Access = ({ req }) => {
  const appKey = req.headers.get("x-app-key");
  if (appKey && appKey === process.env.APP_KEY) {
    return true;
  }
  return false;
};
