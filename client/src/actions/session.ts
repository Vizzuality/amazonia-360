import "server-only";

import { cookies } from "next/headers";

import { env } from "@/env.mjs";

export type Session = {
  access_token: string;
  expires_in: number;
};

export async function login() {
  return fetch(
    `https://idb-gis.maps.arcgis.com/sharing/rest/oauth2/token/?client_id=${env.ARCGIS_CLIENT_ID}&client_secret=${env.ARCGIS_CLIENT_SECRET}&grant_type=client_credentials`,
  ).then((res) => res.json());
}

export async function session({ refresh = false }: { refresh?: boolean }) {
  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get("session");
  const expireInCookie = cookiesStore.get("session_expire");

  const now = Date.now();

  const token = sessionCookie?.value;
  const expires_in = Number(expireInCookie?.value || 0);
  const refresh_exprires_in = now + 60 * 60 * 1000;

  if (refresh || now >= expires_in || refresh_exprires_in >= expires_in) {
    const data = await login();
    const e = now + data.expires_in * 1000;

    // Set the cookie
    cookiesStore.set("session", data.access_token, {
      httpOnly: false,
      secure: true,
      expires: e,
      sameSite: "strict",
      path: "/",
    });

    cookiesStore.set("session_expire", `${e}`, {
      httpOnly: false,
      secure: true,
      expires: e,
      sameSite: "strict",
      path: "/",
    });

    return {
      token: data.access_token,
      expires_in: e,
    };
  }

  if (cookiesStore.has("session")) {
    return {
      token,
      expires_in,
    };
  }

  return null;
}
