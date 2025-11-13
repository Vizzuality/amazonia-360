"use server";

import { cookies as getCookies } from "next/headers";

import { getPayload } from "payload";

import config from "@payload-config";

export async function createAnonymousUser() {
  const payload = await getPayload({ config });

  const anonymousUser = await payload.create({
    collection: "anonymous-users",
    data: {
      apiKey: crypto.randomUUID(),
      enableAPIKey: true,
    },
    overrideAccess: false,
    context: {
      "x-app-key": process.env.APP_KEY,
    },
  });

  const cookies = await getCookies();

  if (!anonymousUser.apiKey) {
    throw new Error("Failed to create anonymous user");
  }

  cookies.set("anonymous-token", anonymousUser.apiKey, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
  });

  return {
    id: anonymousUser.id,
  };
}
