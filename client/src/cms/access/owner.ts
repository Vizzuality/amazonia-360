import { Access } from "payload";

export const ownPolymorphicUser: Access = ({ req }) => {
  const { user } = req;

  if (user) {
    return {
      [`user.value`]: { equals: user.id },
      [`user.relationTo`]: { equals: user.collection },
    };
  }

  return false;
};

export const ownPolymorphicAnonymousUser: Access = ({ req }) => {
  const { user } = req;

  if (user && user.collection === "anonymous-users") {
    return {
      [`user.value`]: { equals: user.apiKey },
      [`user.relationTo`]: { equals: "anonymous-users" },
    };
  }

  return false;
};
