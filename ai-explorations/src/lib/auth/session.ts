import type { Payload } from "payload";

import { getUserPayloadHeaders } from "@/lib/auth/user-token";

export type SessionUser = {
  id: string;
  collection?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type Session = {
  user: SessionUser;
  expires?: string;
};

type PayloadAuth = Pick<Payload, "auth"> & { config: Pick<Payload["config"], "cookiePrefix"> };

/**
 * The frontend user, read from the user token cookie only. The shared Payload cookie belongs to
 * the /admin session and never identifies anyone here; a non-`users` token is treated as none.
 */
export async function getFrontendUser(payload: PayloadAuth, headers: Headers) {
  const { user } = await payload.auth({
    headers: getUserPayloadHeaders(headers, payload.config.cookiePrefix),
  });

  if (user?.collection !== "users") return null;
  return user;
}

export async function getSession(payload: PayloadAuth, headers: Headers): Promise<Session | null> {
  const user = await getFrontendUser(payload, headers);

  if (!user) return null;

  return {
    user: {
      id: String(user.id),
      collection: user.collection,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
    },
  };
}
