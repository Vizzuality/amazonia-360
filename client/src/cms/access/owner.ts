import { Access } from "payload";

export const ownUserAccess: Access = ({ req }) => {
  const { user } = req;

  if (user && user.collection === "admins") {
    return true;
  }

  if (user && user.collection === "anonymous-users") {
    return {
      [`user.value`]: { equals: user.id },
      [`user.relationTo`]: { equals: "anonymous-users" },
    };
  }

  if (user && user.collection === "users") {
    return {
      [`user.value`]: { equals: user.id },
      [`user.relationTo`]: { equals: "users" },
    };
  }

  return false;
};
