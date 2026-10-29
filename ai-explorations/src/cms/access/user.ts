import type { Access } from "payload";

export const userAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (user.collection === "admins") {
    return true;
  }

  return {
    id: { equals: user.id },
  };
};
