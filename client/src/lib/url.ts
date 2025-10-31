import { env } from "@/env.mjs";

export const getAbsoluteURL = (path: string) => {
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}${path}`;
  }

  return `${env.NEXT_PUBLIC_URL || "http://localhost:3000"}${path}`;
};
