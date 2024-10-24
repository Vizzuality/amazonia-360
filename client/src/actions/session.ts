import "server-only";

import { cookies } from "next/headers";

import axios from "axios";

import { env } from "@/env.mjs";

export type Session = {
  access_token: string;
  expires_in: number;
};

export async function login() {
  return await axios.get<Session>(
    `https://atlas.iadb.org/portal/sharing/rest/oauth2/token/?client_id=${env.ARCGIS_CLIENT_ID}client_secret=${env.ARCGIS_CLIENT_SECRET}&grant_type=client_credentials`,
  );
}

export async function session() {
  const cookiesStore = await cookies();
  const now = Date.now();
  const sessionExpire = +(cookiesStore.get("session_expire") || 0);

  if (!cookiesStore.has("session") || now >= sessionExpire || now + 600000 >= sessionExpire) {
    const { data } = await login();

    // Set the cookie
    const cookiesStore = await cookies();
    cookiesStore.set("session", btoa(data.access_token), {
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
  }
}

export async function getToken() {}
