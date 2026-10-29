import type { Access, FieldAccess } from "payload";

export const adminAccess: Access = ({ req: { user } }) => {
  if (!user) return false;

  return user.collection === "admins";
};

export const fieldAdminAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false;

  return user.collection === "admins";
};
