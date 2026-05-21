import type { AuthStrategy, AuthStrategyResult, CollectionSlug, Endpoint } from "payload";

import { auth, signOut } from "@/lib/auth";

type AuthjsCollection = Extract<CollectionSlug, "users" | "anonymous-users">;

const isAdminRequest = (headers: Headers): boolean => {
  const currentPath = headers.get("x-current-path") ?? "";
  return currentPath === "/admin" || currentPath.startsWith("/admin/");
};

// Builds the NextAuth-backed Payload strategy used by Users and AnonymousUsers.
// Skipping admin-context requests prevents non-admin sessions from being surfaced
// inside Payload's admin panel (which would trigger the Unauthorized loop).
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
