import type { Payload } from "payload";

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

/**
 * Payload 4 keeps one token cookie for every auth collection, so an admin signed in at
 * /admin presents the same cookie the frontend reads. Only a `users` token is a session here.
 */
export async function getSession(
  payload: Pick<Payload, "auth">,
  headers: Headers,
): Promise<Session | null> {
  const { user } = await payload.auth({ headers });

  if (user?.collection !== "users") return null;

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
