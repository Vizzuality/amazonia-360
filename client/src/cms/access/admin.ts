import type { Access, FieldAccess } from "payload";

export const adminAccess: Access = ({ req: { user } }) => {
  if (!user) return false;

  if (user.role === "admin") return true;

  return false;
};

export const fieldAdminAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false;

  if (user.role === "admin") return true;

  return false;
};
