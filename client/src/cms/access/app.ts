import type { Access } from "payload";
export const appAccess: Access = ({ req }) => {
  // Check that a valid APP_KEY is present in the headers

  console.log("Checking app access with headers:", req.headers.get("x-app-key"));

  const appKey = req.headers.get("x-app-key");
  if (appKey && appKey === process.env.APP_KEY) {
    return true;
  }
  return false;
};
