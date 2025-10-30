import { env } from "@/env.mjs";

export const getAbsoluteURL = (path: string) => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${path}`;
  }

  return `${env.NEXT_PUBLIC_URL || "http://localhost:3000"}${path}`;
};
