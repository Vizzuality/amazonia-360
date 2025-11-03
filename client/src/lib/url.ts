import { env } from "@/env.mjs";

let absoluteUrl = "";

export const getAbsoluteURL = (path: string) => {
  if (absoluteUrl) {
    return absoluteUrl;
  }

  if (process.env.VERCEL_BRANCH_URL) {
    absoluteUrl = `https://${process.env.VERCEL_BRANCH_URL}${path}`;
    return absoluteUrl;
  }

  absoluteUrl = `${env.NEXT_PUBLIC_URL || "http://localhost:3000"}${path}`;
  return absoluteUrl;
};
