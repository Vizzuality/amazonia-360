import type { Access } from "payload";

/**
 * Any real account. Reports are a login wall rather than per-report privacy:
 * a shared report link must keep working between accounts, so this does not
 * constrain by owner. Ownership still gates update and delete.
 */
export const authenticatedAccess: Access = ({ req: { user } }) => {
  if (!user) return false;

  return user.collection === "users" || user.collection === "admins";
};
