import type { Access } from "payload";

/**
 * Inactive documents stay readable to admins so the admin UI, which reuses this same `read`
 * access, can still list and edit them.
 */
export const activeOrAdminAccess: Access = ({ req: { user } }) => {
  if (user?.collection === "admins") return true;

  return { active: { equals: true } };
};
