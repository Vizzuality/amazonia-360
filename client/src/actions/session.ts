import "server-only";

import { cookies } from "next/headers";

import { env } from "@/env.mjs";

export type Session = {
  access_token: string;
  expires_in: number;
};

export async function login() {
  return fetch(
    `https://atlas.iadb.org/portal/sharing/rest/oauth2/token/?client_id=${env.ARCGIS_CLIENT_ID}&client_secret=${env.ARCGIS_CLIENT_SECRET}&grant_type=client_credentials`,
  ).then((res) => res.json());
}

export async function session() {
  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get("session");
  const expireInCookie = cookiesStore.get("session_expire");

  const token = sessionCookie?.value;
  const expires_in = Number(expireInCookie?.value || 0);

  const now = Date.now();

  // if (!cookiesStore.has("session") || !token || now >= expires_in || now + 600000 >= expires_in) {
  const data = await login();

  // Set the cookie
  cookiesStore.set("session", data.access_token, {
    httpOnly: false,
    secure: true,
    expires: Date.now() + data.expires_in * 1000,
    sameSite: "strict",
    path: "/",
  });

  cookiesStore.set("session_expire", `${Date.now() + data.expires_in * 1000}`, {
    httpOnly: false,
    secure: true,
    expires: Date.now() + data.expires_in * 1000,
    sameSite: "strict",
    path: "/",
  });

  return {
    token: data.access_token,
    expires_in: Date.now() + data.expires_in * 1000,
  };
  // }

  if (cookiesStore.has("session")) {
    return {
      token,
      expires_in,
    };
  }

  return null;
}
