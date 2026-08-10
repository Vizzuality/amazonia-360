import type { AuthStrategy, AuthStrategyResult, CollectionSlug, Endpoint } from "payload";

import { auth, signOut } from "@/lib/auth";

type AuthjsCollection = Extract<CollectionSlug, "users">;

const isAdminPath = (pathname: string): boolean =>
  pathname === "/admin" || pathname.startsWith("/admin/");

// Payload keeps every auth strategy in one global list, appends its own `local-jwt`
// (the one that reads the `payload-token` cookie) last, and stops at the first strategy
// that returns a user. So whenever this strategy resolves a NextAuth session, Payload
// never reaches `local-jwt` and never reads the admin's cookie at all — an admin who is
// also signed in to the public app is authenticated as a `users` doc and every write in
// the admin panel fails `adminAccess` with a 403.
//
// Stepping aside is therefore the only way an admin session can be honoured, and it has
// to be decided from headers alone: Payload hands a strategy `headers` and nothing else —
// no request, no URL, no target collection.
//
// Two kinds of admin traffic, two signals:
//   - Page loads of /admin carry `x-current-path`, set by the middleware (see proxy.ts).
//   - The panel's own reads and writes go to /v1/api/*, which is outside the middleware
//     matcher, so they carry no `x-current-path`. The browser does send `Referer` with
//     the admin page they came from.
//
// A request with no `Referer` at all is not a browser request from the public app, so it
// steps aside too. Server-to-self SDK calls land here and carry no cookies anyway, so
// there is no session for this strategy to resolve.
const isAdminRequest = (headers: Headers): boolean => {
  const currentPath = headers.get("x-current-path") ?? "";
  if (isAdminPath(currentPath)) return true;

  const referer = headers.get("referer");
  if (!referer) return true;

  try {
    return isAdminPath(new URL(referer).pathname);
  } catch {
    return true;
  }
};

// Builds the NextAuth-backed Payload strategy used by Users.
export const createAuthjsStrategy = <C extends AuthjsCollection>(collection: C): AuthStrategy => ({
  name: "authjs",
  authenticate: async ({ headers, payload }) => {
    if (isAdminRequest(headers)) {
      return { user: null };
    }

    const session = await auth();

    if (!session?.user?.id) {
      return { user: null };
    }

    const user = await payload.findByID({
      collection,
      id: session.user.id,
      disableErrors: true,
    });

    return { user: user ? { ...user, collection } : null } as AuthStrategyResult;
  },
});

export const logoutEndpoint: Endpoint = {
  path: "/logout",
  method: "post",
  handler: async () => {
    await signOut({ redirect: false });
    return Response.json({ message: "You have been logged out successfully." });
  },
};
